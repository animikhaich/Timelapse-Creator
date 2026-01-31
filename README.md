[![Release Version][release-shield]][release-url]
[![Downloads][downloads-shield]][downloads-url]
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
    <img src="assets/icon.png" alt="Logo" width="150" height="150">

  <h2 align="center">Video Time Lapse Creator</h2>

  <p align="center">
    A automatic batch timelapse creator, originally created for a real-world use-case.
    <br />
    <a href="https://github.com/animikhaich/Timelapse-Creator#demo">View Demo</a>
    ·
    <a href="https://github.com/animikhaich/Timelapse-Creator/releases/latest">Download</a>
    ·
    <a href="https://github.com/animikhaich/Timelapse-Creator/issues/new">Report Bug</a>
    ·
    <a href="https://github.com/animikhaich/Timelapse-Creator/issues/new">Request Feature</a>
  </p>
</p>

![Video Time Lapse Creator][product-screenshot]

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [Table of Contents](#table-of-contents)
- [About The Project](#about-the-project)
- [Demo](#demo)
- [Downloads (Executable)](#downloads-executable)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Built With](#built-with)
  - [Minimum Hardware Requirements](#minimum-hardware-requirements)
  - [Installation](#installation)
- [Usage](#usage)
- [Building Executables](#building-executables)
- [Changelog](#changelog)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
    - [Animikh Aich](#animikh-aich)
- [Acknowledgements](#acknowledgements)

<!-- ABOUT THE PROJECT -->

## About The Project

Time-lapse photography is a technique whereby the frequency at which film frames are captured is much more spread out than the frequency used to view the sequence. It allows the user to create beautiful videos of a slow-changing environment. For example, if you have one 2 hours of video containing the sunset, you can create a 2-minute short video of it with just the click of a button.

## Demo 
_This will be updated soon._

## Downloads (Executable)

Pre-built executables are available for download. These are automatically built using GitHub Actions to ensure maximum compatibility.

- [Windows](https://github.com/animikhaich/Timelapse-Creator/releases/latest/download/Time-Lapse-Creator-windows-x64.exe) - Compatible with Windows 7 and later
- [Linux](https://github.com/animikhaich/Timelapse-Creator/releases/latest/download/Time-Lapse-Creator-linux-x64.run) - Compatible with Ubuntu 20.04+ and most modern Linux distributions
- [macOS](https://github.com/animikhaich/Timelapse-Creator/releases/latest/download/Time-Lapse-Creator-macos) - Compatible with macOS 10.15+

**Note**: Linux executables are built on Ubuntu 20.04 (glibc 2.31) to ensure broad compatibility across modern Linux distributions. For Ubuntu 18.04 or earlier, please build locally using the provided scripts.

<!-- GETTING STARTED -->

## Getting Started

If you just want to run the code, then you can head to the Releases Page and download the executable. I have it both for Linux and Windows. If you want to develop, modify or contribute, you can follow along.

### Prerequisites

- [Python 3](https://www.python.org/)

### Built With

I wanted to reduce the file-size for this simple project. Hence, I used Tkinter instead of PyQT5.

- [Tkinter](https://docs.python.org/3/library/tkinter.html)
- [OpenCV](https://opencv.org/)

### Minimum Hardware Requirements

- CPU: 1 Logical Cores (Threads)
- RAM: 500 MB
- Storage: 500 MB (Including Dependencies)
- OS: Linux, Windows, MacOS

### Installation

1. Clone the repo

```sh
git clone https://github.com/animikhaich/Timelapse-Creator.git
```

2. Install Python packages

```sh
pip install -r requirements.txt
```

1. Run the main file

```sh
python main.py
```

<!-- USAGE EXAMPLES -->

## Usage

There are two buttons and a dropdown selector.

- With the first button, you can select and open one or more Video files
- Then you can select the amount of speedup that you want to introduce to your video
- Finally, press the "Convert" button to see the video being processed on the progress bar. 

<!-- BUILDING EXECUTABLES -->

## Building Executables

If you want to build the executables yourself, please refer to [BUILD.md](BUILD.md) for detailed instructions.

The executables are automatically built using GitHub Actions for multiple platforms:
- On every push to the `master` branch
- When a new release is published
- Can be manually triggered from the Actions tab

Linux executables are built on Ubuntu 20.04 to ensure broad compatibility across modern Linux distributions.

<!-- CHANGELOG -->

## Changelog

See the [Changelog](CHANGELOG.md).

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/animikhaich/Timelapse-Creator/issues?q=is%3Aopen) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->

## License

Distributed under the MIT License. See [LICENSE](LICENSE.md) for more information.

<!-- CONTACT -->

## Contact

#### Animikh Aich

- LinkedIn: [Animikh Aich](https://www.linkedin.com/in/animikh-aich/)
- Email: [animikhaich@gmail.com](mailto:animikhaich@gmail.com)
- Twitter: [@AichAnimikh](https://twitter.com/AichAnimikh)

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

- [brentvollebregt - Auto Py-to-EXE](https://github.com/brentvollebregt/auto-py-to-exe)

<!-- MARKDOWN LINKS & IMAGES -->

[release-shield]: https://img.shields.io/github/release/animikhaich/Timelapse-Creator.svg?style=flat-square
[release-url]: https://github.com/animikhaich/Timelapse-Creator/releases
[downloads-shield]: https://img.shields.io/github/downloads/animikhaich/Timelapse-Creator/total.svg?style=flat-square
[downloads-url]: https://github.com/animikhaich/Timelapse-Creator/releases
[contributors-shield]: https://img.shields.io/github/contributors/animikhaich/Timelapse-Creator.svg?style=flat-square
[contributors-url]: https://github.com/animikhaich/Timelapse-Creator/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/animikhaich/Timelapse-Creator.svg?style=flat-square
[forks-url]: https://github.com/animikhaich/Timelapse-Creator/network/members
[stars-shield]: https://img.shields.io/github/stars/animikhaich/Timelapse-Creator.svg?style=flat-square
[stars-url]: https://github.com/animikhaich/Timelapse-Creator/stargazers
[issues-shield]: https://img.shields.io/github/issues/animikhaich/Timelapse-Creator.svg?style=flat-square
[issues-url]: https://github.com/animikhaich/Timelapse-Creator/issues
[license-shield]: https://img.shields.io/github/license/animikhaich/Timelapse-Creator.svg?style=flat-square
[license-url]: https://github.com/animikhaich/Timelapse-Creator/blob/master/LICENSE.md
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/animikh-aich/
[product-screenshot]: assets/screenshot.png
