const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3333;

function tratarCampo(valor) {
    return valor === "" ? null : valor;
}

app.use(cors({
    origin: '*'
}));
app.use(express.json());

app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            message: 'API rodando com sucesso!', 
            hora_do_banco: result.rows[0].now 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao conectar no banco' });
    }
});

app.post('/auth/register', async (req, res) => {
    const {
        nome,
        nascimento,
        sexo,
        estadoCivil,
        conjuge,
        escolaridade,
        situacao,
        mae,
        pai,
        telefone,
        cep,
        uf,
        endereco,
        bairro,
        complemento,
        cargo,
        membro,
        batismo,
        email,
        senha,
        cidade,
        cargo2,
        cargo3,
        cargo4,
    } = req.body;

    const emailLower = email?.toLowerCase();

    if (!nome || !emailLower || !senha) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    }

    if (senha.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    try {
        const userExists = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [emailLower]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        const result = await pool.query(
            `
            INSERT INTO usuarios (
                nome,
                dtanasc,
                sexo,
                estadocivil,
                conjuge,
                grauinst,
                situacao,
                mae,
                pai,
                celular,
                cep,
                uf,
                endereco,
                bairro,
                complemento,
                cargo,
                membrodesde,
                dtabatismo,
                email,
                password,
                cidade,
                cargo2,
                cargo3,
                cargo4
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
            )
            RETURNING id, nome, email
            `,
            [
                nome,
                nascimento,
                tratarCampo(sexo),
                estadoCivil,
                tratarCampo(conjuge),
                tratarCampo(escolaridade),
                situacao,
                tratarCampo(mae),
                tratarCampo(pai),
                tratarCampo(telefone),
                tratarCampo(cep),
                tratarCampo(uf),
                tratarCampo(endereco),
                tratarCampo(bairro),
                tratarCampo(complemento),
                tratarCampo(cargo),
                tratarCampo(membro),
                tratarCampo(batismo),
                emailLower,
                hashedPassword,
                tratarCampo(cidade),
                tratarCampo(cargo2),
                tratarCampo(cargo3),
                tratarCampo(cargo4)
            ]
        );

        res.status(201).json({
            message: 'Cadastro realizado com sucesso',
            user: result.rows[0],
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);

        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if (!validPassword) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        res.json({ 
            message: 'Login realizado com sucesso',
            user: {
                id: user.rows[0].id,
                name: user.rows[0].name,
                email: user.rows[0].email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});
