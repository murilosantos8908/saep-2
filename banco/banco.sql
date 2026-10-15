CREATE DATABASE IF NOT EXISTS almoxarifado CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE almoxarifado;

CREATE TABLE
    usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(120) NOT NULL,
        email VARCHAR(160) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        tipo ENUM ('administrador', 'almoxarife', 'solicitante') NOT NULL DEFAULT 'solicitante',
        status ENUM ('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(80) NOT NULL UNIQUE
    );

CREATE TABLE
    fornecedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(120) NOT NULL,
        contato VARCHAR(120),
        telefone VARCHAR(30),
        email VARCHAR(160)
    );

CREATE TABLE
    produtos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(160) NOT NULL,
        categoria_id INT,
        fornecedor_id INT,
        unidade_medida VARCHAR(30) NOT NULL DEFAULT 'unidade',
        quantidade_estoque DECIMAL(10, 2) NOT NULL DEFAULT 0,
        estoque_minimo DECIMAL(10, 2) NOT NULL DEFAULT 0,
        validade DATE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE SET NULL,
        FOREIGN KEY (fornecedor_id) REFERENCES fornecedores (id) ON DELETE SET NULL
    );

CREATE TABLE
    movimentacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        produto_id INT NOT NULL,
        tipo_movimentacao ENUM ('entrada', 'saida', 'ajuste') NOT NULL,
        quantidade DECIMAL(10, 2) NOT NULL,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_id INT NOT NULL,
        observacao VARCHAR(255),
        FOREIGN KEY (produto_id) REFERENCES produtos (id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    );

CREATE TABLE
    pedidos_solicitacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        produto_id INT NOT NULL,
        quantidade DECIMAL(10, 2) NOT NULL,
        status ENUM ('pendente', 'aprovado', 'atendido', 'recusado') DEFAULT 'pendente',
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
        FOREIGN KEY (produto_id) REFERENCES produtos (id)
    );

INSERT INTO
    categorias (nome)
VALUES
    ('Higiene'),
    ('Limpeza geral'),
    ('Equipamentos de proteção');

INSERT INTO
    fornecedores (nome, telefone, email)
VALUES
    (
        'Química Limpa',
        '(11) 3333-1000',
        'contato@quimicalimpa.com'
    ),
    (
        'Casa & Cia',
        '(11) 3333-2000',
        'vendas@casaecia.com'
    );

INSERT INTO
    produtos (
        nome,
        categoria_id,
        fornecedor_id,
        unidade_medida,
        quantidade_estoque,
        estoque_minimo
    )
VALUES
    (
        'Detergente neutro 500ml',
        2,
        1,
        'unidade',
        120,
        30
    ),
    ('Água sanitária 5L', 2, 1, 'unidade', 4, 10),
    ('Esponja multiuso', 2, 2, 'pacote', 8, 20),
    ('Luva de limpeza M', 3, 2, 'par', 6, 15),
    (
        'Papel toalha interfolhado',
        1,
        2,
        'pacote',
        90,
        25
    );

-- Senha do usuário demo: 123456 (gere o hash com bcryptjs antes de inserir em produção)
-- Dados adicionais para demonstração (senha para as contas abaixo: 123456)
INSERT INTO usuarios (nome,email,senha,tipo,status) VALUES
('Ana Oliveira','admin@almoxarifado.com','$2a$10$rQ0yxh3BQ2MvaW8SLf/8Z.KtF7oFtIzkjbOtQix8sPjBCVM4jZ9VW','administrador','ativo'),
('Marcos Silva','marcos@almoxarifado.com','$2a$10$rQ0yxh3BQ2MvaW8SLf/8Z.KtF7oFtIzkjbOtQix8sPjBCVM4jZ9VW','almoxarife','ativo'),
('Juliana Costa','juliana@almoxarifado.com','$2a$10$rQ0yxh3BQ2MvaW8SLf/8Z.KtF7oFtIzkjbOtQix8sPjBCVM4jZ9VW','solicitante','ativo'),
('Rafael Souza','rafael@almoxarifado.com','$2a$10$rQ0yxh3BQ2MvaW8SLf/8Z.KtF7oFtIzkjbOtQix8sPjBCVM4jZ9VW','solicitante','ativo');
INSERT INTO categorias (nome) VALUES ('Papéis'),('Descartáveis'),('Utensílios');
INSERT INTO fornecedores (nome,contato,telefone,email) VALUES
('Protege Mais','Carla Mendes','(11) 3333-3000','vendas@protegemais.com'),
('Higiene Total','Paulo Lima','(11) 3333-4000','contato@higienetotal.com'),
('Distribuidora Central','Equipe comercial','(11) 3333-5000','vendas@distribuidoracentral.com');
INSERT INTO produtos (nome,categoria_id,fornecedor_id,unidade_medida,quantidade_estoque,estoque_minimo) VALUES
('Desinfetante lavanda 2L',2,1,'unidade',48,12),
('Álcool 70% 1L',2,2,'unidade',32,10),
('Saco de lixo 100L',5,3,'pacote',55,15),
('Papel higiênico folha dupla',4,2,'fardo',24,8),
('Pano multiuso',6,1,'unidade',40,10),
('Máscara descartável',3,1,'caixa',18,5),
('Sabonete líquido 5L',1,2,'galão',14,6);
INSERT INTO movimentacoes (produto_id,tipo_movimentacao,quantidade,usuario_id,observacao) VALUES
(1,'entrada',120,2,'Carga inicial de demonstração'),
(2,'saida',6,3,'Reposição de limpeza'),
(3,'entrada',40,2,'Recebimento de fornecedor'),
(4,'saida',3,4,'Consumo do setor administrativo'),
(6,'entrada',48,2,'Carga inicial de demonstração'),
(7,'saida',5,3,'Uso interno');
INSERT INTO pedidos_solicitacoes (usuario_id,produto_id,quantidade,status) VALUES
(3,1,4,'pendente'),(4,5,2,'aprovado'),(3,6,1,'atendido'),(4,3,3,'pendente');

ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;