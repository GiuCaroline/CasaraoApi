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
                name: user.rows[0].nome,
                email: user.rows[0].email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.get('/auth/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await pool.query(
            'SELECT * FROM usuarios WHERE id = $1',
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            user: user.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.put('/auth/updateUser/:id', async (req, res) => {
  const { id } = req.params;

  let {
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
    cor
  } = req.body;

  try {
    const campos = [];
    const valores = [];
    let index = 1;

    function addCampo(nomeCampo, valor) {
      if (valor !== undefined) {
        campos.push(`${nomeCampo} = $${index}`);
        valores.push(tratarCampo(valor));
        index++;
      }
    }

    addCampo("nome", nome);
    addCampo("dtanasc", nascimento);
    addCampo("sexo", sexo);
    addCampo("estadocivil", estadoCivil);
    addCampo("conjuge", conjuge);
    addCampo("grauinst", escolaridade);
    addCampo("situacao", situacao);
    addCampo("mae", mae);
    addCampo("pai", pai);
    addCampo("celular", telefone);
    addCampo("cep", cep);
    addCampo("uf", uf);
    addCampo("endereco", endereco);
    addCampo("bairro", bairro);
    addCampo("complemento", complemento);
    addCampo("cargo", cargo);
    addCampo("membrodesde", membro);
    addCampo("dtabatismo", batismo);
    addCampo("email", email?.toLowerCase());
    addCampo("cidade", cidade);
    addCampo("cargo2", cargo2);
    addCampo("cargo3", cargo3);
    addCampo("cargo4", cargo4);
    addCampo("cor", cor);

    if (senha) {
      const hashedPassword = await bcrypt.hash(senha, 10);
      campos.push(`password = $${index}`);
      valores.push(hashedPassword);
      index++;
    }

    if (campos.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    valores.push(id);

    const query = `
      UPDATE usuarios
      SET ${campos.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await pool.query(query, valores);

    res.json({
      message: "Usuário atualizado com sucesso",
      user: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

app.listen(port, '0.0.0.0', () => { console.log('Servidor rodando na porta ${port}'); })