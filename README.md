# Flask billing system Application

This is a simple billing system application built using Flask, SQLite, google auth and SQLAlchemy. Users can create, update, and delete items. Additionally, users can select items and generate bills.

## Requirements

- Python 3.9
- Install Python 3.9 and create a virtual environment using the command:
  ```bash
  python -m venv venv
  ```

## Installation

1. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux:
     ```bash
     source venv/bin/activate
     ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create .env file and copy the contents of env-example to the .env file and fill the .env file with your desired credentials:

## Running the Application

To run the application, use the following command:
```bash
python setup.py
```