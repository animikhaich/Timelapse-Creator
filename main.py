from tkinter import Tk, Label, Button, NE, Frame, LabelFrame, W, E, N, S, HORIZONTAL, StringVar, OptionMenu, filedialog
from tkinter.ttk import Progressbar
import time


class TimelapseGUI:
    # CLASS CONSTANTS
    MIN_WIDTH = 500
    MIN_HEIGHT = 300
    CHOICES = [
        '5x',
        '10x',
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
    ]

    def __init__(self):
        # variables
        self.files = None
        self.root = Tk()
        self.root.title("Timelapse Creator")
        self.root.minsize(self.MIN_WIDTH, self.MIN_HEIGHT)
        self.config_frames()
        self.config_buttons()

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
        tkvar = StringVar(self.buttons_frame)
        tkvar.set('Choose Speed')
        dropdown_button = OptionMenu(self.buttons_frame, tkvar, *self.CHOICES)
        dropdown_button.grid(row=0, column=1, padx=(10), pady=10)

        # Convert Button
        btn_convert = Button(self.buttons_frame, text='Convert')
        btn_convert.grid(row=0, column=2, padx=(10), pady=10)

        # PROGRESS BAR
        progress = Progressbar(self.progress_frame, orient=HORIZONTAL,
                               length=100, mode='determinate')
        progress.grid(row=0, column=0,  sticky=E+W)

    def run(self):
        self.root.mainloop()

    def file_format_generator(self, formats: list):
        formats = formats + [value.upper() for value in formats]
        return " ".join(formats)

    def update_progress(self):
        self.progress['value'] = 25
        self.root.update_idletasks()

    def browseFiles(self):
        self.files = filedialog.askopenfilenames(
            initialdir="/media/Data/Downloads/",
            title="Videos",
            filetypes=(
                ("Video Files", self.file_format_generator(self.SUPPORTED_FORMATS)),)
        )
        print(self.files)


if __name__ == '__main__':
    gui = TimelapseGUI()
    gui.run()
