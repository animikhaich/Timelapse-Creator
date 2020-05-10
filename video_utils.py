import numpy as np
import cv2
import os


def validate_video(video_path: str):
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()

    if ret:
        return True
    else:
        return False


def validate_bunch_videos(video_path_tuple: tuple):
    for video_path in video_path_tuple:
        valid = validate_video(video_path)

        if not valid:
            return False

    return True


def get_output_path(video_path, dest_path: str = None):
    video_filename = os.path.split(video_path)[-1]

    if dest_path:
        output_folder = os.path.split(dest_path)[0]
    else:
        output_folder = os.path.split(video_path)[0]

    if not os.path.isdir(output_folder):
        os.makedirs(output_folder)

    output_path = os.path.join(
        output_folder, os.path.splitext(video_filename)[0]+'.mp4'
    )

    return output_path


def video_converter(video_path: str, fps_multiplier: int, dest_path: str = None):
    # Initializations
    cap = cv2.VideoCapture(video_path)
    video_width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    video_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    num_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    num_fps = cap.get(cv2.CAP_PROP_FPS)

    # Calculate Output FPS
    fps = num_fps * fps_multiplier

    # Get the output path
    output_path = get_output_path(video_path, dest_path)

    # Initialize Video Writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(
        output_path,
        fourcc,
        float(fps),
        (video_width, video_height)
    )

    for frame_num in num_frames:
        ret, frame = cap.read()
        if not ret:
            break

        # Write the frame
        out.write(frame)

    out.release()


def bulk_video_converter(video_path_tuple: tuple, fps_multiplier: int, dest_path: str = None):
    for video_path in video_path_tuple:
        try:
            video_converter(video_path, fps_multiplier, dest_path)
        except Exception as e:
            print(f"Error Converting Video: {e}")
            return False

    return True
