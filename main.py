from tkinter import Tk, Label, NE, Frame, LabelFrame, W, E, N, S, HORIZONTAL, StringVar, filedialog, messagebox, PhotoImage
from tkinter.ttk import Progressbar, Button, OptionMenu, Label
from video_utils import bulk_validate_video, bulk_video_converter
import time, _thread


# TODO: Add Logging
# TODO: Add Cancel/Abort Button
# TODO: Add Check for feasibility of video speed
# TODO: Add a more elegant solution for multithreading

class TimelapseGUI():
    # CLASS CONSTANTS
    READY_TEXT = "Ready!"
    ICON_NAME = "video_converter.png"
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
        # variables
        self.files = None
        self.file_status = None
        self.var_open_files = None
        self.progress = None

        # Root Window Properties
        self.root = Tk()
        self.root.title("Timelapse Creator")
        self.root.minsize(self.MIN_WIDTH, self.MIN_HEIGHT)
        try:
            self.icon = PhotoImage(file=self.ICON_NAME)
            self.root.iconphoto(False, self.icon) 
        except Exception as e:
            print(f"Could not load Icon due to Error: {e}")

        # Buttons and Widgets
        self.config_frames()
        self.config_buttons()
        self.config_progress_bar()
        self.config_label()

    def config_frames(self):
        self.buttons_frame = Frame(self.root)
        self.buttons_frame.grid(row=0, column=0, columnspan=3,
                                padx=10, pady=10, sticky=E+W)

        self.progress_frame = Frame(self.root)
        self.progress_frame.grid(row=1, column=0, columnspan=3,
                                 padx=10, pady=10, sticky=E+W)

        # Configure how many rows and columns are there in and progress_frame
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(1, weight=1)

        self.progress_frame.columnconfigure(0, weight=1)
        self.progress_frame.rowconfigure(0, weight=1)

    def config_buttons(self):
        # Open File Browser Button
        btn_open_files = Button(
            self.buttons_frame,
            command=self.browseFiles,
            text='Select Videos'
        )
        btn_open_files.grid(row=0, column=0, padx=(10), pady=10)

        # Dropdown Selector button
        self.var_open_files = StringVar(self.buttons_frame)
        dropdown_button = OptionMenu(
            self.buttons_frame, self.var_open_files, *self.CHOICES)
        dropdown_button.grid(row=0, column=1, padx=(10), pady=10)

        # Convert Button
        btn_convert = Button(self.buttons_frame,
                             text='Convert', command=self.convert_video)
        btn_convert.grid(row=0, column=2, padx=(10), pady=10)

    def config_progress_bar(self):
        self.progress = Progressbar(self.progress_frame, orient=HORIZONTAL,
                                    length=100, mode='determinate')
        self.progress.grid(row=1, column=0,  sticky=E+W)

    def config_label(self):
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
        self.root.mainloop()

    def file_format_generator(self, formats: list):
        formats = formats + [value.upper() for value in formats]
        return " ".join(formats)

    def browseFiles(self):
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
        if not self.files:
            messagebox.showwarning(
                title="File Not Selected",
                message="You have not selected any file. Please Click on \"Select Videos\""
            )
            return False

        fps_multiplier = self.var_open_files.get()
        if not fps_multiplier:
            return False

        try:
            fps_multiplier = int(fps_multiplier[:-1])
        except Exception as e:
            messagebox.showwarning(
                title="Select Speed",
                message="Please Select Speed of the video from the dropdown menu"
            )
            return True

        _thread.start_new_thread(bulk_video_converter, (
            self.files,
            fps_multiplier,
            None,
            self.file_status,
            self.file_status_percent,
            self.progress,
            self.root
        ))


if __name__ == '__main__':
    gui = TimelapseGUI()
    gui.run()
