#!/bin/bash

# Build the frontend
cd frontend
npm install
npm run build

# Build the backend
cd ../backend
npm install

# Start the backend server
npm start 