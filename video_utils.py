from tkinter import Tk
from tkinter.ttk import Label, Progressbar
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


def bulk_validate_video(video_path_tuple: tuple):
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
        output_folder = os.path.join(os.path.split(video_path)[0], 'outputs')

    if not os.path.isdir(output_folder):
        os.makedirs(output_folder)

    output_path = os.path.join(
        output_folder, os.path.splitext(video_filename)[0]+'.mp4'
    )

    return output_path


def video_converter(
    video_path: str,
    fps_multiplier: int,
    dest_path: str = None,
    tkinter_progressbar_object: Progressbar = None,
    tkinter_label_percent_object: Label = None,
    tkinter_root_tk_object: Tk = None
):
    # Initializations
    cap = cv2.VideoCapture(video_path)
    video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    num_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

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

    for frame_num in range(num_frames):
        if tkinter_progressbar_object and tkinter_root_tk_object and tkinter_label_percent_object:
            percentage_complete = frame_num/num_frames*100
            tkinter_progressbar_object['value'] = int(percentage_complete)
            tkinter_label_percent_object['text'] = f"{percentage_complete:.2f}%"
            tkinter_root_tk_object.update_idletasks()

        ret, frame = cap.read()

        if frame_num % fps_multiplier != 0:
            continue

        # Write the frame
        out.write(frame)
    
    out.release()
    if tkinter_root_tk_object and tkinter_label_percent_object:
        tkinter_label_percent_object['text'] = f"100%"
        tkinter_root_tk_object.update_idletasks()


def bulk_video_converter(
    video_path_tuple: tuple,
    fps_multiplier: int,
    dest_path: str = None,
    tkinter_label_object: Label = None,
    tkinter_label_percent_object: Label = None,
    tkinter_progressbar_object: Progressbar = None,
    tkinter_root_tk_object: Tk = None
):

    for i, video_path in enumerate(video_path_tuple):

        if tkinter_label_object and tkinter_root_tk_object:
            updated_text = f"Processing File {i+1} of {len(video_path_tuple)}: {os.path.split(video_path)[-1]}"
            tkinter_label_object['text'] = updated_text
            tkinter_root_tk_object.update_idletasks()

        try:
            if tkinter_progressbar_object and tkinter_root_tk_object:
                video_converter(
                    video_path,
                    fps_multiplier,
                    dest_path,
                    tkinter_progressbar_object=tkinter_progressbar_object,
                    tkinter_label_percent_object=tkinter_label_percent_object,
                    tkinter_root_tk_object=tkinter_root_tk_object
                )
            else:
                video_converter(video_path, fps_multiplier, dest_path)
        except Exception as e:
            print(f"Error Converting Video: {e}")
            return False

    return True
