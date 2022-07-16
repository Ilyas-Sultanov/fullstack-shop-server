import nodemailer from 'nodemailer';

class MailService {
  transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    });
  }

  async sendActivationMail(to: string, link: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `Активация аккаунта на ${process.env.API_URL}`,
      text: '',
      html: 
        `
        <div>
          <h1>Для активации перейдите по ссылке</h1>
          <a href="${link}">${link}</a>
        </div>
        `
    });
  }

  async sendResetPassMail(to: string, link: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `Восстановление доступа к ${process.env.API_URL}`,
      text: '',
      html: 
        `
        <div>
          <h1>Для получения доступа, перейдите по ссылке</h1>
          <a href="${link}">${link}</a>
        </div>
        `
    });
  }
}

export default new MailService();


// e3yK9PkFWUiSxFLUNnP5


// SMTP_HOST = smtp.gmail.com
// SMTP_PORT = 587
// SMTP_USER = sv.ilyas@gmail.com
// SMTP_PASSWORD = maniamania



// import nodemailer from 'nodemailer';

// class MailService {
//   transporter: nodemailer.Transporter;

//   constructor() {
//     this.transporter = nodemailer.createTransport({
//       service: 'Gmail',
//       host: process.env.SMTP_HOST,
//       port: Number(process.env.SMTP_PORT),
//       secure: false, // true for 465, false for other ports
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASSWORD,
//       }
//     });
//   }

//   async sendActivationMail(to: string, link: string) {
//     await this.transporter.sendMail({
//       from: process.env.SMTP_USER,
//       to,
//       subject: `Активация аккаунта на ${process.env.API_URL}`,
//       text: '',
//       html: 
//         `
//         <div>
//           <h1>Для активации перейдите по ссылке</h1>
//           <a href="${link}">${link}</a>
//         </div>
//         `
//     });
//   }
// }

// export default new MailService();