# Steganography Lab

A full-stack web application that hides secret text inside images using the Least Significant Bit (LSB) technique. 

## Features
- **Encode**: Hide any text message inside a PNG or JPG image.
- **Decode**: Extract the hidden text message from a steganographic PNG image.
- **Haskell Core**: Fast, reliable LSB image processing using Haskell and `JuicyPixels`.
- **Python Backend**: Lightweight API powered by Flask.
- **Modern UI**: Clean, responsive, dark-themed frontend utilizing standard HTML, CSS, and JS.

## Prerequisites
- **Python 3.x**
- **GHC (Glasgow Haskell Compiler)** and **Cabal**
- Python packages: `Flask`, `flask-cors`
- Haskell package: `JuicyPixels`

## Setup Instructions

1. **Install Haskell Dependencies**
   ```bash
   cabal update
   cabal install --lib JuicyPixels
   ```

2. **Compile the Haskell Script**
   Navigate to the `backend` directory and run:
   ```bash
   cd backend
   ghc -O2 -o stego stego.hs
   ```

3. **Install Python Dependencies**
   ```bash
   pip install flask flask-cors
   ```

4. **Run the Flask Server**
   ```bash
   cd backend
   python app.py
   ```

5. **Access the Application**
   Open your browser and navigate to `http://localhost:5000` to interact with the application.
