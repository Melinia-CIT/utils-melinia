use clap::Parser;
use std::path::PathBuf;
use vid_to_txt::{process_video, ProcessingConfig, ProcessingEvent};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(help = "Path to the video file")]
    video_path: PathBuf,

    #[arg(
        short,
        long,
        default_value = "200",
        help = "Number of output columns (10-1000)"
    )]
    columns: u32,

    #[arg(short, long, help = "Compress output to a single .gz file")]
    concat: bool,

    #[arg(
        short,
        long,
        help = "Output directory for frames (default: frame_text/)"
    )]
    output_dir: Option<PathBuf>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    if !args.video_path.exists() {
        eprintln!("Error: File '{}' not found.", args.video_path.display());
        std::process::exit(1);
    }

    if args.columns < 10 || args.columns > 1000 {
        eprintln!("Error: Columns must be between 10 and 1000.");
        std::process::exit(1);
    }

    let output_dir = args
        .output_dir
        .unwrap_or_else(|| PathBuf::from("frame_text"));

    println!("Video to ASCII Converter");
    println!("========================");
    println!("Input: {}", args.video_path.display());
    println!("Columns: {}", args.columns);
    println!(
        "Output: {}",
        if args.concat {
            "output.txt.gz".to_string()
        } else {
            output_dir.display().to_string()
        }
    );
    println!();

    let config = ProcessingConfig {
        video_path: args.video_path.to_string_lossy().to_string(),
        output_columns: args.columns,
        concat_mode: args.concat,
    };

    let (tx, rx) = std::sync::mpsc::channel();

    std::thread::spawn(move || {
        if let Err(e) = process_video(config, tx) {
            eprintln!("Error: {}", e);
        }
    });

    loop {
        match rx.recv() {
            Ok(event) => match event {
                ProcessingEvent::Started {
                    video_info,
                    target_w,
                    target_h,
                } => {
                    println!(
                        "Source: {}x{} @ {:.1}fps (DAR: {:.2}) → {}x{} text",
                        video_info.width,
                        video_info.height,
                        video_info.fps,
                        video_info.dar,
                        target_w,
                        target_h
                    );
                    println!("Processing frames...");
                }
                ProcessingEvent::Progress {
                    frames_processed, ..
                } => {
                    print!("\rProcessed {} frames...", frames_processed);
                    std::io::Write::flush(&mut std::io::stdout())?;
                }
                ProcessingEvent::Compressing { total_frames } => {
                    println!("\nCompressing {} frames...", total_frames);
                }
                ProcessingEvent::Completed {
                    total_frames,
                    output_path,
                } => {
                    println!("\nDone! {} frames processed.", total_frames);
                    println!("Output saved to: {}", output_path);
                    break;
                }
                ProcessingEvent::Error(err) => {
                    eprintln!("\nError: {}", err);
                    std::process::exit(1);
                }
            },
            Err(_) => break,
        }
    }

    Ok(())
}
