import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import basicSsl from '@vitejs/plugin-basic-ssl';

// export default defineConfig({
//   plugins: [
//     react(),
//     basicSsl() // This forces HTTPS!
//   ],
//   server: {
//     host: true, // This broadcasts your server to your local Wi-Fi network
//     port: 5173
//   }
// });