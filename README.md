# MemmoProject

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.3.

---

## 🚀 วิธีรัน Frontend Project (Getting Started)

### 1. ติดตั้ง Prerequisites

ก่อนรัน project ให้ติดตั้งสิ่งต่อไปนี้:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | >= 18.x | https://nodejs.org |
| npm | >= 9.x (included with Node.js) | - |
| Angular CLI | >= 18.x | Install via command below (ติดตั้งผ่านคำสั่งด้านล่าง) |

ติดตั้ง Angular CLI (ครั้งแรก):
```bash
npm install -g @angular/cli
```

---

### 2. ติดตั้ง Dependencies

เปิด Terminal แล้วไปที่ root folder ของ project (โฟลเดอร์ที่มีไฟล์ `package.json`) จากนั้นรัน:

```bash
npm install
```

> ⚠️ ต้องรันคำสั่งนี้ก่อนเสมอเมื่อ clone project ใหม่หรือมีการเปลี่ยนแปลง `package.json`

---

### 3. รัน Development Server

```bash
npm start
```

หรือใช้คำสั่ง Angular CLI โดยตรง:

```bash
ng serve
```

จากนั้นเปิดเบราว์เซอร์ไปที่: **http://localhost:4200/**

Application จะ reload อัตโนมัติเมื่อมีการเปลี่ยนแปลงไฟล์ source code

---

### 4. คำสั่งทั้งหมดที่ใช้ได้ (Available Scripts)

| คำสั่ง / Command | ผลลัพธ์ / Description |
|--------|---------|
| `npm start` | รัน development server / Start dev server (http://localhost:4200) |
| `npm run local` | รัน development server แบบ development configuration / Start with development config |
| `npm run build` | Build project สำหรับ production / Build for production (output ที่ `dist/`) |
| `npm run watch` | Build แบบ watch mode สำหรับ development / Build in watch mode |
| `npm test` | รัน unit tests ผ่าน Karma / Run unit tests via Karma |

---

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
