// Envio de emails da aplicação.
// Com SMTP_HOST configurado no .env, o email é enviado de verdade.
// Sem ele (por exemplo, em desenvolvimento), o conteúdo é exibido no terminal
// do backend, o que permite testar a recuperação de senha sem conta de email.

const nodemailer = require('nodemailer');

let transporte = null;

// Cria a conexão SMTP apenas uma vez, quando o SMTP estiver configurado
const obterTransporte = () => {
    if (!process.env.SMTP_HOST) {
        return null;
    }

    if (!transporte) {
        const porta = Number(process.env.SMTP_PORT || 587);

        transporte = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: porta,
            secure: porta === 465,
            auth: process.env.SMTP_USER
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined
        });
    }

    return transporte;
};

const enviarEmail = async ({ para, assunto, texto }) => {
    const conexao = obterTransporte();

    if (!conexao) {
        console.log(
            '\n========== EMAIL (SMTP não configurado, exibido só no terminal) ==========\n' +
            `Para: ${para}\nAssunto: ${assunto}\n\n${texto}\n` +
            '==========================================================================\n'
        );
        return;
    }

    await conexao.sendMail({
        from: process.env.EMAIL_REMETENTE || process.env.SMTP_USER,
        to: para,
        subject: assunto,
        text: texto
    });
};

module.exports = { enviarEmail };
