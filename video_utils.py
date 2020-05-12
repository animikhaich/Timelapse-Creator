from tkinter import Tk, messagebox
from tkinter.ttk import Label, Progressbar, Button
import numpy as np
import cv2
import os


def validate_video(video_path: str):
    """
    validate_video utility function to check the video validity

    Checks the video validity by reading the first frame. 
    If frame is found, the video is valid, else invalid

    Args:
        video_path (str): Path of the video for checking validity

    Returns:
        boolean: True if video is valid, else False
    """
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()

    if ret:
        return True
    else:
        return False


def bulk_validate_video(video_path_tuple: tuple):
    """
    bulk_validate_video validates multiple videos

    Uses the validate_video function and validates multiple videos

    Args:
        video_path_tuple (tuple): tuple containing the list of file paths

    Returns:
        boolean: True if all videos are valid, False if any one fails the check
    """
    for video_path in video_path_tuple:
        valid = validate_video(video_path)

        if not valid:
            return False

    return True


def get_output_path(video_path, dest_path: str = None):
    """
    get_output_path Generate the output path from video paths

    Generates the video output path-string based on the inputs given.
    If no destination path is specified, the output path is set to the source directory

    Args:
        video_path (string): Path of the source Video file
        dest_path (str, optional): Destination Folder Path. Defaults to None.

    Returns:
        str: Complete Output Path of the file
    """
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
    """
    video_converter Main Video Converter Function

    Uses OpenCV to read and write the video while skipping frames based on input
    It also optionally updates the GUI elements that are passed:
    - Progress Bar
    - Current Processing File
    - Percentage of Progress

    Args:
        video_path (str): path of the input video
        fps_multiplier (int): rate of increase of speed of the video
        dest_path (str, optional): directory path for the output video. Defaults to None.
        tkinter_progressbar_object (Progressbar, optional): GUI Element - Progress Bar. Defaults to None.
        tkinter_label_percent_object (Label, optional): GUI Element - Label. Defaults to None.
        tkinter_root_tk_object (Tk, optional): GUI Element - Root Window. Defaults to None.
    """
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

    # Iterate over each frame and write relevant ones
    for frame_num in range(num_frames):

        # Update GUI elements if present
        if tkinter_progressbar_object and tkinter_root_tk_object and tkinter_label_percent_object:
            percentage_complete = frame_num/num_frames*100
            tkinter_progressbar_object['value'] = int(percentage_complete)
            tkinter_label_percent_object['text'] = f"{percentage_complete:.2f}%"
            tkinter_root_tk_object.update_idletasks()

        # Read the Frame
        ret, frame = cap.read()

        # Skip the frame if the rate does not match
        if frame_num % fps_multiplier != 0:
            continue

        # Write the frame if the rate matches
        out.write(frame)

    # Release the video footer
    out.release()

    # Update GUI elements to complete the process
    if tkinter_root_tk_object and tkinter_label_percent_object and tkinter_progressbar_object:
        tkinter_label_percent_object['text'] = f"100%"
        tkinter_progressbar_object['value'] = 100
        tkinter_root_tk_object.update_idletasks()


def bulk_video_converter(
    video_path_tuple: tuple,
    fps_multiplier: int,
    dest_path: str = None,
    tkinter_label_object: Label = None,
    tkinter_label_percent_object: Label = None,
    tkinter_progressbar_object: Progressbar = None,
    tkinter_root_tk_object: Tk = None,
    tkinter_convert_button: Button = None
):
    """
    bulk_video_converter Main Video Converter Function for Multiple Videos

    Uses the video_converter function to convert multiple videos together
    It also optionally updates the GUI elements that are passed:
    - Progress Bar
    - Current Processing File
    - Percentage of Progress

    Args:
        video_path (str): path of the input video
        fps_multiplier (int): rate of increase of speed of the video
        dest_path (str, optional): directory path for the output video. Defaults to None.
        tkinter_label_object (Label, optional):GUI Element - Label. Defaults to None.
        tkinter_label_percent_object (Label, optional): GUI Element - Label. Defaults to None.
        tkinter_progressbar_object (Progressbar, optional): GUI Element - Progress Bar. Defaults to None.
        tkinter_root_tk_object (Tk, optional): GUI Element - Root Window. Defaults to None.
        tkinter_convert_button (Button, optional): GUI Element - Button. Defaults to None.

    Returns:
        boolean: True if all conversions are successful, else False
    """

    # Iterate over each video sequentially
    for i, video_path in enumerate(video_path_tuple):

        # Update Progress details in GUI, if available
        if tkinter_label_object and tkinter_root_tk_object:
            updated_text = f"Processing File {i+1} of {len(video_path_tuple)}: {os.path.split(video_path)[-1]}"
            tkinter_label_object['text'] = updated_text
            tkinter_root_tk_object.update_idletasks()

        # Attempt to convert the video and update GUI elements if available
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
            # If converstion fails, raise error
            print(f"Error Converting Video: {e}")
            messagebox.showerror(
                title="Failed!",
                message="One or more videos have failed conversion"
            )
            tkinter_convert_button["state"] = "normal"
            return False

    # Upon successful conversion, notify the user
    messagebox.showinfo(
        title="Success!",
        message="All the Videos have been successfully converted"
    )

    # Update GUI elements upon successful converstion, if available
    if tkinter_label_object and tkinter_root_tk_object and tkinter_convert_button:
        tkinter_label_object['text'] = "Ready!"
        tkinter_convert_button["state"] = "normal"
        tkinter_root_tk_object.update_idletasks()
    return True
