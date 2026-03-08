use std::collections::BTreeMap;
use std::fs;
use std::io::{self, Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::{mpsc, Arc, Mutex};
use std::thread;

use flate2::write::GzEncoder;
use flate2::Compression;

// --- Configuration ---
pub const OUTPUT_COLUMNS: u32 = 200;
pub const FONT_RATIO: f32 = 0.44;

// --- Color Detection Configuration ---
const BLUE: (i32, i32, i32) = (0, 0, 230);
const WHITE: (i32, i32, i32) = (215, 215, 215);

const BLUE_DISTANCE_TOLERANCE: i32 = 180;
const WHITE_DISTANCE_TOLERANCE: i32 = 250;

const BLUE_MIN_LUMINANCE: i32 = 5;
const BLUE_MAX_LUMINANCE: i32 = 40;

const WHITE_MIN_LUMINANCE: i32 = 140;
const WHITE_MAX_LUMINANCE: i32 = 255;

const CHAR_MAP: [char; 10] = ['·', '~', 'o', 'x', '+', '=', '*', '%', '$', '@'];

#[derive(Debug, Clone)]
pub struct VideoInfo {
    pub width: u32,
    pub height: u32,
    pub fps: f32,
    pub dar: f32,
}

#[derive(Debug, Clone)]
pub struct ProcessingConfig {
    pub video_path: String,
    pub output_columns: u32,
    pub concat_mode: bool,
}

#[derive(Debug, Clone)]
pub enum ProcessingEvent {
    Started {
        video_info: VideoInfo,
        target_w: u32,
        target_h: u32,
    },
    Progress {
        frames_processed: usize,
        preview_frame: Option<String>,
    },
    Compressing {
        total_frames: usize,
    },
    Completed {
        total_frames: usize,
        output_path: String,
    },
    Error(String),
}

pub fn get_video_info(path: &str) -> io::Result<VideoInfo> {
    let output = Command::new("ffprobe")
        .arg("-v")
        .arg("error")
        .arg("-select_streams")
        .arg("v:0")
        .arg("-show_entries")
        .arg("stream=width,height,r_frame_rate,display_aspect_ratio")
        .arg("-of")
        .arg("csv=p=0")
        .arg(path)
        .output()?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(io::Error::new(
            io::ErrorKind::Other,
            format!("ffprobe failed: {}", err),
        ));
    }

    let data = String::from_utf8_lossy(&output.stdout);
    let trimmed_data = data.trim();

    let parts: Vec<&str> = trimmed_data.split(',').collect();
    if parts.len() != 4 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!(
                "Expected 4 fields, got {}. Data: '{}'",
                parts.len(),
                trimmed_data
            ),
        ));
    }

    let w = parts[0].parse::<u32>().map_err(|_| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Invalid width: {}", parts[0]),
        )
    })?;
    let h = parts[1].parse::<u32>().map_err(|_| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Invalid height: {}", parts[1]),
        )
    })?;

    let fps_str = parts[2];
    let fps: f32 = if fps_str == "N/A" || fps_str == "0/0" || fps_str.is_empty() {
        30.0
    } else if fps_str.contains('/') {
        let nums: Vec<&str> = fps_str.split('/').collect();
        match nums[0].parse::<f32>() {
            Ok(num) => {
                let den: f32 = nums[1].parse().unwrap_or(1.0);
                num / den
            }
            Err(_) => 30.0,
        }
    } else {
        fps_str.parse::<f32>().unwrap_or(30.0)
    };

    let dar_str = parts[3];
    let raw_dar: f32 = if dar_str.contains(':') {
        let nums: Vec<&str> = dar_str.split(':').collect();
        let num: f32 = nums[0].parse().unwrap_or(w as f32);
        let den: f32 = nums[1].parse().unwrap_or(h as f32);
        num / den
    } else if dar_str.contains('/') {
        let nums: Vec<&str> = dar_str.split('/').collect();
        let num: f32 = nums[0].parse().unwrap_or(w as f32);
        let den: f32 = nums[1].parse().unwrap_or(h as f32);
        num / den
    } else if dar_str == "N/A" || dar_str == "0:1" || dar_str.is_empty() {
        w as f32 / h as f32
    } else {
        dar_str.parse().unwrap_or(w as f32 / h as f32)
    };

    let dar = if raw_dar < 0.5 || raw_dar > 5.0 {
        w as f32 / h as f32
    } else {
        raw_dar
    };

    Ok(VideoInfo {
        width: w,
        height: h,
        fps,
        dar,
    })
}

fn generate_frame_string(buffer: &[u8], width: usize, height: usize) -> io::Result<String> {
    let mut output = String::with_capacity(width * height * 2);
    let mut in_blue_span = false;

    for y in 0..height {
        let row_offset = y * width;
        for x in 0..width {
            let pixel_idx = (row_offset + x) * 3;
            let r = buffer[pixel_idx] as i32;
            let g = buffer[pixel_idx + 1] as i32;
            let b = buffer[pixel_idx + 2] as i32;

            let lum = (0.2126 * r as f32 + 0.7152 * g as f32 + 0.0722 * b as f32) as i32;

            let dist_blue = (r - BLUE.0).abs() + (g - BLUE.1).abs() + (b - BLUE.2).abs();
            let dist_white = (r - WHITE.0).abs() + (g - WHITE.1).abs() + (b - WHITE.2).abs();

            let mut char_to_write = ' ';
            let mut is_blue = false;

            if dist_blue < BLUE_DISTANCE_TOLERANCE {
                is_blue = true;
                let scaled = ((lum - BLUE_MIN_LUMINANCE) * 9
                    / (BLUE_MAX_LUMINANCE - BLUE_MIN_LUMINANCE))
                    .clamp(0, 9);
                char_to_write = CHAR_MAP[scaled as usize];
            } else if dist_white < WHITE_DISTANCE_TOLERANCE {
                let scaled = ((lum - WHITE_MIN_LUMINANCE) * 9
                    / (WHITE_MAX_LUMINANCE - WHITE_MIN_LUMINANCE))
                    .clamp(0, 9);
                char_to_write = CHAR_MAP[scaled as usize];
            }

            if is_blue && !in_blue_span {
                output.push_str("<span class=\"b\">");
                in_blue_span = true;
            } else if !is_blue && in_blue_span {
                output.push_str("</span>");
                in_blue_span = false;
            }

            output.push(char_to_write);
        }
        output.push('\n');
    }

    if in_blue_span {
        output.push_str("</span>");
    }

    Ok(output)
}

/// Generate plain ASCII frame (no HTML tags) for preview display
pub fn generate_plain_frame(buffer: &[u8], width: usize, height: usize) -> String {
    let mut output = String::with_capacity(width * height + height);

    for y in 0..height {
        let row_offset = y * width;
        for x in 0..width {
            let pixel_idx = (row_offset + x) * 3;
            let r = buffer[pixel_idx] as i32;
            let g = buffer[pixel_idx + 1] as i32;
            let b = buffer[pixel_idx + 2] as i32;

            let lum = (0.2126 * r as f32 + 0.7152 * g as f32 + 0.0722 * b as f32) as i32;

            let dist_blue = (r - BLUE.0).abs() + (g - BLUE.1).abs() + (b - BLUE.2).abs();
            let dist_white = (r - WHITE.0).abs() + (g - WHITE.1).abs() + (b - WHITE.2).abs();

            let char_to_write = if dist_blue < BLUE_DISTANCE_TOLERANCE {
                let scaled = ((lum - BLUE_MIN_LUMINANCE) * 9
                    / (BLUE_MAX_LUMINANCE - BLUE_MIN_LUMINANCE))
                    .clamp(0, 9);
                CHAR_MAP[scaled as usize]
            } else if dist_white < WHITE_DISTANCE_TOLERANCE {
                let scaled = ((lum - WHITE_MIN_LUMINANCE) * 9
                    / (WHITE_MAX_LUMINANCE - WHITE_MIN_LUMINANCE))
                    .clamp(0, 9);
                CHAR_MAP[scaled as usize]
            } else {
                ' '
            };

            output.push(char_to_write);
        }
        output.push('\n');
    }

    output
}

pub fn process_video(
    config: ProcessingConfig,
    event_sender: mpsc::Sender<ProcessingEvent>,
) -> io::Result<()> {
    let video_path = &config.video_path;
    let output_columns = config.output_columns;
    let concat_mode = config.concat_mode;

    if !PathBuf::from(video_path).exists() {
        let _ = event_sender.send(ProcessingEvent::Error(format!(
            "File '{}' not found.",
            video_path
        )));
        return Ok(());
    }

    let info = match get_video_info(video_path) {
        Ok(i) => i,
        Err(e) => {
            let _ = event_sender.send(ProcessingEvent::Error(e.to_string()));
            return Ok(());
        }
    };

    let target_w = output_columns;
    let exact_h = (target_w as f32 / info.dar) * FONT_RATIO;
    let target_h = exact_h.floor() as u32;

    if target_h < 1 {
        let _ = event_sender.send(ProcessingEvent::Error(
            "Calculated height is too small".to_string(),
        ));
        return Ok(());
    }

    let _ = event_sender.send(ProcessingEvent::Started {
        video_info: info.clone(),
        target_w,
        target_h,
    });

    let out_dir = PathBuf::from("frame_text");
    if !concat_mode {
        fs::create_dir_all(&out_dir)?;
    }

    let (tx, rx) = mpsc::channel::<(usize, Vec<u8>)>();
    let rx = Arc::new(Mutex::new(rx));

    let (result_tx, result_rx): (
        mpsc::Sender<(usize, String)>,
        mpsc::Receiver<(usize, String)>,
    ) = mpsc::channel();
    let result_rx = Arc::new(Mutex::new(result_rx));

    let num_workers = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);

    for _ in 0..num_workers {
        let rx = Arc::clone(&rx);
        let result_tx = result_tx.clone();
        let out_dir = out_dir.clone();
        let concat_mode = concat_mode;
        let target_w = target_w;
        let target_h = target_h;

        thread::spawn(move || loop {
            let msg = rx.lock().unwrap().recv();
            match msg {
                Ok((frame_idx, buffer)) => {
                    match generate_frame_string(&buffer, target_w as usize, target_h as usize) {
                        Ok(frame_text) => {
                            if concat_mode {
                                if result_tx.send((frame_idx, frame_text)).is_err() {
                                    break;
                                }
                            } else {
                                let file_path = out_dir.join(format!("frame_{:04}.txt", frame_idx));
                                if let Err(e) = fs::write(&file_path, frame_text) {
                                    eprintln!("Error writing frame {}: {}", frame_idx, e);
                                }
                            }
                        }
                        Err(e) => eprintln!("Error generating frame {}: {}", frame_idx, e),
                    }
                }
                Err(_) => break,
            }
        });
    }

    drop(result_tx);

    let mut child = Command::new("ffmpeg")
        .arg("-i")
        .arg(video_path)
        .arg("-loglevel")
        .arg("error")
        .arg("-vf")
        .arg(format!(
            "scale={}:{}:flags=bicubic,fps={}",
            target_w, target_h, info.fps
        ))
        .arg("-f")
        .arg("rawvideo")
        .arg("-pix_fmt")
        .arg("rgb24")
        .arg("-")
        .stdout(Stdio::piped())
        .spawn()?;

    let mut stdout = child.stdout.take().expect("Failed to capture stdout");
    let frame_size = (target_w * target_h * 3) as usize;
    let mut frame_idx = 0;

    let mut collected_frames: BTreeMap<usize, String> = BTreeMap::new();

    loop {
        let mut buffer = vec![0u8; frame_size];

        match stdout.read_exact(&mut buffer) {
            Ok(_) => {
                let preview = generate_plain_frame(&buffer, target_w as usize, target_h as usize);

                if tx.send((frame_idx, buffer)).is_err() {
                    let _ = event_sender.send(ProcessingEvent::Error(
                        "Worker thread disconnected".to_string(),
                    ));
                    break;
                }
                frame_idx += 1;

                let _ = event_sender.send(ProcessingEvent::Progress {
                    frames_processed: frame_idx,
                    preview_frame: Some(preview),
                });

                if concat_mode {
                    while let Ok((idx, text)) = result_rx.lock().unwrap().try_recv() {
                        collected_frames.insert(idx, text);
                    }
                }
            }
            Err(_) => break,
        }
    }

    let _ = child.wait();
    drop(tx);

    if concat_mode {
        while let Ok((idx, text)) = result_rx.lock().unwrap().recv() {
            collected_frames.insert(idx, text);
        }

        let _ = event_sender.send(ProcessingEvent::Compressing {
            total_frames: collected_frames.len(),
        });

        let output_file = fs::File::create("output.txt.gz")?;
        let mut encoder = GzEncoder::new(output_file, Compression::default());
        let delimiter = b"\0";

        for (_, frame_content) in &collected_frames {
            encoder.write_all(frame_content.as_bytes())?;
            encoder.write_all(delimiter)?;
        }

        encoder.finish()?;

        let _ = event_sender.send(ProcessingEvent::Completed {
            total_frames: collected_frames.len(),
            output_path: "output.txt.gz".to_string(),
        });
    } else {
        let _ = event_sender.send(ProcessingEvent::Completed {
            total_frames: frame_idx,
            output_path: "frame_text/".to_string(),
        });
    }

    Ok(())
}
