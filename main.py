from tkinter import Tk, Label, NE, Frame, LabelFrame, W, E, N, S, HORIZONTAL, StringVar, filedialog, messagebox, PhotoImage
from tkinter.ttk import Progressbar, Button, OptionMenu, Label
from video_utils import bulk_validate_video, bulk_video_converter
from version import __version__
import os
import time
import _thread


# TODO: Add Logging
# TODO: Add Cancel/Abort Button
# TODO: Add Check for feasibility of video speed
# TODO: Add a more elegant solution for multithreading

class TimelapseGUI():
    # CLASS CONSTANTS
    READY_TEXT = "Ready!"
    ICON_NAME = "assets/favicon.png"
    MIN_WIDTH = 500
    MIN_HEIGHT = 300
    CHOICES = [
        'Choose Speed',
        '2x',
        '5x',
        '10x',
        '20x',
        '30x',
        '50x',
        '100x',
        '200x',
        '300x',
        '500x',
        '1000x',
    ]
    SUPPORTED_FORMATS = [
        '.mp4',
        '.webm',
        '.mpg',
        '.avi',
        '.mov',
        '.m4v',
        '.flv',
        '.mkv'
    ]

    def __init__(self):
        """
        __init__

        Initializes the GUI elements
        """
        # variables
        self.files = None
        self.file_status = None
        self.var_open_files = None
        self.progress = None

        # Root Window Properties
        self.root = Tk()
        self.root.title(f"Timelapse Creator v{__version__}")
        self.root.minsize(self.MIN_WIDTH, self.MIN_HEIGHT)

        # This part is to make sure that the program runs with or without n icon file.
        try:
            if os.path.exists(self.ICON_NAME):
                self.icon = PhotoImage(file=self.ICON_NAME)
                self.root.iconphoto(False, self.icon)
            elif os.path.exists(os.path.split(self.ICON_NAME)[-1]):
                self.icon = PhotoImage(file=os.path.split(self.ICON_NAME)[-1])
                self.root.iconphoto(False, self.icon)
        except Exception as e:
            print(f"Could not load Icon due to Error: {e}")

        # Buttons and Widgets
        self.config_frames()
        self.config_buttons()
        self.config_progress_bar()
        self.config_label()

    def config_frames(self):
        """
        config_frames 

        Set up the different sections of the GUI window
        """
        # BUTTON SPACE
        self.buttons_frame = Frame(self.root)
        self.buttons_frame.grid(row=0, column=0, columnspan=3,
                                padx=10, pady=10, sticky=E+W)

        # PROGRESS BAR SPACE
        self.progress_frame = Frame(self.root)
        self.progress_frame.grid(row=1, column=0, columnspan=3,
                                 padx=10, pady=10, sticky=E+W)

        # Configure how many rows and columns are there in and progress_frame
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(1, weight=1)

        self.progress_frame.columnconfigure(0, weight=1)
        self.progress_frame.rowconfigure(0, weight=1)

    def config_buttons(self):
        """
        config_buttons 

        Define the interactive Buttons used for the GUI App
        """
        # Open File Browser Button
        self.btn_open_files = Button(
            self.buttons_frame,
            command=self.browseFiles,
            text='Select Videos'
        )
        self.btn_open_files.grid(row=0, column=0, padx=(10), pady=10)

        # Dropdown Selector button
        self.var_open_files = StringVar(self.buttons_frame)
        self.dropdown_button = OptionMenu(
            self.buttons_frame, self.var_open_files, *self.CHOICES)
        self.dropdown_button.grid(row=0, column=1, padx=(10), pady=10)

        # Convert Button
        self.btn_convert = Button(self.buttons_frame,
                                  text='Convert', command=self.convert_video)
        self.btn_convert.grid(row=0, column=2, padx=(10), pady=10)

    def config_progress_bar(self):
        """
        config_progress_bar 

        Configure the Progress bar
        """
        self.progress = Progressbar(self.progress_frame, orient=HORIZONTAL,
                                    length=100, mode='determinate')
        self.progress.grid(row=1, column=0,  sticky=E+W)

    def config_label(self):
        """
        config_label 

        Add the Dynamic labels for progress tracking
        """
        self.file_status = Label(
            self.progress_frame,
            text=self.READY_TEXT
        )
        self.file_status.grid(row=0, column=0, padx=(10), pady=10)

        self.file_status_percent = Label(
            self.progress_frame,
            text="0%"
        )
        self.file_status_percent.grid(row=1, column=0, padx=(0), pady=0)

    def run(self):
        """
        run

        Run the GUI Loop.
        """
        self.root.mainloop()

    def file_format_generator(self, formats: list):
        """
        file_format_generator Generates the required file format - helper function

        Takes a List of strings as input, adds their upper case versions as well
        Converts them to a space separated string, and returns the same

        Args:
            formats (list): comma separated strings of file extensions in lower case

        Returns:
            string: space separated file extensions along with corresponding upper case format
        """
        formats = formats + [value.upper() for value in formats]
        return " ".join(formats)

    def browseFiles(self):
        """
        browseFiles

        Creates the File Selector dialogbox

        Returns:
            boolean: True if valid file is selected, False if invalid
        """
        self.files = filedialog.askopenfilenames(
            # initialdir="/media/Data/Downloads/",
            title="Videos",
            filetypes=(
                ("Video Files", self.file_format_generator(self.SUPPORTED_FORMATS)),
            )
        )

        # Check file validity
        valid = bulk_validate_video(self.files)
        if not valid:
            messagebox.showerror(
                title="Invalid File",
                message="The File that you entered is invalid. Please retry!"
            )
            return False
        return True

    def convert_video(self):
        """
        convert_video Main video converter function

        Uses OpenCV to read and write the video
        While skipping frames based on the given input

        Returns:
            boolean: Returns True or False based on success or failure
        """

        # Warning Box for if proper files have not been selected
        if not self.files:
            messagebox.showwarning(
                title="File Not Selected",
                message="You have not selected any file. Please Click on \"Select Videos\""
            )
            return False

        # Extract the multiplier number
        fps_multiplier = self.var_open_files.get()
        if not fps_multiplier:
            return False

        # If invalid multiplier selected, raise warning
        try:
            fps_multiplier = int(fps_multiplier[:-1])
        except Exception as e:
            messagebox.showwarning(
                title="Select Speed",
                message="Please Select Speed of the video from the dropdown menu"
            )
            return True

        # Disable the button during converstion to avoid multiple inputs
        self.btn_convert["state"] = "disabled"

        # Start the main conversion in a different thread to avoid UI freeze
        _thread.start_new_thread(bulk_video_converter, (
            self.files,
            fps_multiplier,
            None,
            self.file_status,
            self.file_status_percent,
            self.progress,
            self.root,
            self.btn_convert
        ))


if __name__ == '__main__':
    gui = TimelapseGUI()
    gui.run()
