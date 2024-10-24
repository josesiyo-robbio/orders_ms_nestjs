FROM node:21-alpine3.19

WORKDIR /usr/src/app

# Copia los archivos de dependencias primero
COPY package.json ./
COPY package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia solo el directorio de prisma antes de generar
COPY prisma ./prisma


# Copia el resto de los archivos
COPY . .

EXPOSE 3002
