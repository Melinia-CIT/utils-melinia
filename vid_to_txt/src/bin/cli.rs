//! CLI version of vid_to_txt (original behavior)

use std::sync::mpsc;
use vid_to_txt::{process_video, ProcessingConfig, ProcessingEvent, OUTPUT_COLUMNS};

fn main() -> std::io::Result<()> {
    let args: Vec<String> = std::env::args().collect();

    let concat_mode = args.iter().any(|a| a == "--concat");

    if args.len() < 2 || (args.len() == 2 && concat_mode) {
        eprintln!("Usage: {} <video_file> [--concat]", args[0]);
        eprintln!("  --concat : Output a single compressed 'output.txt.gz' file instead of individual frames.");
        return Ok(());
    }

    let video_path = args
        .iter()
        .skip(1)
        .find(|a| !a.starts_with('-'))
        .expect("Video file argument not found");

    let (tx, rx) = mpsc::channel();

    let config = ProcessingConfig {
        video_path: video_path.clone(),
        output_columns: OUTPUT_COLUMNS,
        concat_mode,
    };

    // Process in a separate thread so we can receive events
    let handle = std::thread::spawn(move || process_video(config, tx));

    // Print events as they come in
    while let Ok(event) = rx.recv() {
        match event {
            ProcessingEvent::Started { video_info, target_w, target_h } => {
                println!(
                    "Processing: {}x{} @ {}fps (DAR: {:.2}) -> {}x{} text",
                    video_info.width, video_info.height, video_info.fps, video_info.dar,
                    target_w, target_h
                );
            }
            ProcessingEvent::Progress { frames_processed, .. } => {
                println!("Processed {} frames...", frames_processed);
            }
            ProcessingEvent::Compressing { total_frames } => {
                println!("Compressing {} frames to output.txt.gz...", total_frames);
            }
            ProcessingEvent::Completed { total_frames, output_path } => {
                println!("Done. Total frames: {}. Output: {}", total_frames, output_path);
            }
            ProcessingEvent::Error(err) => {
                eprintln!("Error: {}", err);
            }
        }
    }

    handle.join().unwrap()
}
