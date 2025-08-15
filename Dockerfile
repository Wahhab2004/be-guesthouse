# Gunakan image Node.js versi 18
FROM node:18

# Tentukan direktori kerja dalam container
WORKDIR /app

# Salin package.json dan package-lock.json ke dalam container
COPY package*.json ./

# Install dependensi aplikasi
RUN npm install

# Salin seluruh file aplikasi ke dalam container
COPY . .

# Ekspos port yang digunakan oleh aplikasi (misalnya port 3000)
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]
