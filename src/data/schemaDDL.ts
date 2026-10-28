/**
 * Sonata ERP - Modelagem Relacional Completa (PostgreSQL 16+)
 * Inclui: Chaves Primárias UUID, Chaves Estrangeiras, Enums de Domínio,
 * Índices de Alta Performance e Triggers de Integridade.
 */

export const postgresSchemaDDL = `-- ============================================================================
-- PROJETO: SONATA ERP - SISTEMA DE GESTÃO PARA ESCOLAS DE MÚSICA (EQUIVALENTE EMUSYS)
-- BANCO DE DADOS: PostgreSQL 15 / 16
-- ESQUEMA RELACIONAL PEDAGÓGICO, FINANCEIRO, AGENDA E GESTÃO DE PESSOAS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Essencial para constraints de exclusão de conflitos temporais

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS (DOMÍNIO DO NEGÓCIO)
-- ----------------------------------------------------------------------------
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'SECRETARY', 'TEACHER', 'STUDENT', 'GUARDIAN');
CREATE TYPE student_status_enum AS ENUM ('ACTIVE', 'LOCKED', 'DROPOUT', 'DEFAULTING');
CREATE TYPE modality_enum AS ENUM ('INDIVIDUAL', 'DUO', 'ENSEMBLE');
CREATE TYPE schedule_type_enum AS ENUM ('REGULAR_LESSON', 'MAKEUP_LESSON', 'PLACEMENT_TEST', 'RECITALS_EVENT');
CREATE TYPE attendance_status_enum AS ENUM ('PENDING', 'PRESENT', 'JUSTIFIED_ABSENCE', 'UNJUSTIFIED_ABSENCE', 'CANCELLED');
CREATE TYPE compensation_model_enum AS ENUM ('HOURLY', 'PERCENTAGE', 'FIXED');
CREATE TYPE invoice_status_enum AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_method_enum AS ENUM ('PIX', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH');
CREATE TYPE cashflow_type_enum AS ENUM ('INCOME', 'EXPENSE');

-- ----------------------------------------------------------------------------
-- 2. GESTÃO DE PESSOAS & CONTAS DE ACESSO
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role user_role_enum NOT NULL DEFAULT 'STUDENT',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Responsáveis Financeiros / Legais (Mães, Pais, Tutores)
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip VARCHAR(10),
    relationship VARCHAR(50) NOT NULL DEFAULT 'Pai/Mãe',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cadastro de Alunos
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guardian_id UUID REFERENCES guardians(id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    birth_date DATE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    medical_notes TEXT, -- Observações ou restrições auditivas/motoras
    status student_status_enum NOT NULL DEFAULT 'ACTIVE',
    makeup_balance INT NOT NULL DEFAULT 0 CHECK (makeup_balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Professores & Modelos de Remuneração
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instruments TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT,
    compensation_model compensation_model_enum NOT NULL DEFAULT 'HOURLY',
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    commission_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    fixed_salary NUMERIC(10, 2) DEFAULT 0.00,
    pays_on_justified_absence BOOLEAN NOT NULL DEFAULT TRUE,
    bank_name VARCHAR(100),
    pix_key VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. INFRAESTRUTURA & CURSOS
-- ----------------------------------------------------------------------------
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    capacity INT NOT NULL DEFAULT 1,
    available_instruments TEXT[] NOT NULL DEFAULT '{}',
    color_hex VARCHAR(7) DEFAULT '#3b82f6',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- INSTRUMENT, VOCAL, THEORY, ENSEMBLE
    description TEXT,
    default_duration_minutes INT NOT NULL DEFAULT 60,
    base_monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Matrícula (Contrato Pedagógico e Financeiro)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    modality modality_enum NOT NULL DEFAULT 'INDIVIDUAL',
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    monthly_fee NUMERIC(10, 2) NOT NULL,
    payment_due_day INT NOT NULL DEFAULT 10 CHECK (payment_due_day BETWEEN 1 AND 31),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. AGENDA, GRADE E VALIDAÇÃO DE CONFLITOS (CORE)
-- ----------------------------------------------------------------------------
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    schedule_type schedule_type_enum NOT NULL DEFAULT 'REGULAR_LESSON',
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    specific_date DATE, -- Preenchido para aulas avulsas ou reposições
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_time_order CHECK (start_time < end_time)
);

-- Índice GIST para busca rápida e proteção contra conflitos de horário
CREATE INDEX idx_schedules_time_room ON schedules (room_id, day_of_week, start_time, end_time);
CREATE INDEX idx_schedules_time_teacher ON schedules (teacher_id, day_of_week, start_time, end_time);

-- ----------------------------------------------------------------------------
-- 5. PRESENÇA & BANCO DE CRÉDITOS DE REPOSIÇÃO
-- ----------------------------------------------------------------------------
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    lesson_date DATE NOT NULL,
    status attendance_status_enum NOT NULL DEFAULT 'PENDING',
    justification_notes TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE makeup_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    attendance_id UUID REFERENCES attendances(id) ON DELETE SET NULL,
    credit_code VARCHAR(20) UNIQUE NOT NULL,
    reason TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'USED', 'EXPIRED')),
    used_at_schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. MÓDULO PEDAGÓGICO, DIÁRIO DE CLASSE & AVALIAÇÕES
-- ----------------------------------------------------------------------------
CREATE TABLE lesson_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    lesson_date DATE NOT NULL,
    content_covered TEXT NOT NULL, -- O que foi trabalhado hoje
    homework_assignment TEXT, -- Lição de casa para a próxima semana
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercícios Técnicos / Rudimentos / Escalas com Metrônomo
CREATE TABLE lesson_technical_drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_note_id UUID NOT NULL REFERENCES lesson_notes(id) ON DELETE CASCADE,
    drill_name VARCHAR(200) NOT NULL,
    target_bpm INT,
    achieved_bpm INT,
    teacher_notes TEXT
);

-- Músicas e Repertório em Estudo
CREATE TABLE lesson_repertoire (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_note_id UUID NOT NULL REFERENCES lesson_notes(id) ON DELETE CASCADE,
    song_title VARCHAR(200) NOT NULL,
    composer VARCHAR(150),
    section_worked VARCHAR(100), -- Ex: "Compassos 1 ao 32"
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' -- IN_PROGRESS, POLISHING, MASTERED
);

-- Anexos Didáticos (Partituras, Tabs, Áudios de Playback)
CREATE TABLE lesson_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_note_id UUID NOT NULL REFERENCES lesson_notes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'SHEET_MUSIC_PDF', 'AUDIO_PLAYBACK', 'VIDEO_DEMO'
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    duration_seconds INT
);

-- Avaliação Periódica por Competências Musicais
CREATE TABLE competency_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rhythm_score NUMERIC(3, 1) NOT NULL CHECK (rhythm_score BETWEEN 0.0 AND 10.0),
    tuning_pitch_score NUMERIC(3, 1) NOT NULL CHECK (tuning_pitch_score BETWEEN 0.0 AND 10.0),
    technique_score NUMERIC(3, 1) NOT NULL CHECK (technique_score BETWEEN 0.0 AND 10.0),
    interpretation_score NUMERIC(3, 1) NOT NULL CHECK (interpretation_score BETWEEN 0.0 AND 10.0),
    feedback_notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. GESTÃO FINANCEIRA, COBRANÇAS RECORRENTES & REPASSE DOCENTE
-- ----------------------------------------------------------------------------
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    reference_month CHAR(7) NOT NULL, -- 'YYYY-MM'
    due_date DATE NOT NULL,
    base_amount NUMERIC(10, 2) NOT NULL,
    fine_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    interest_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    status invoice_status_enum NOT NULL DEFAULT 'PENDING',
    payment_method payment_method_enum,
    paid_at TIMESTAMPTZ,
    pix_copia_e_cola TEXT,
    pix_qr_code_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fechamento de Folha de Pagamento Docente (Payroll)
CREATE TABLE teacher_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    reference_month CHAR(7) NOT NULL, -- 'YYYY-MM'
    compensation_model compensation_model_enum NOT NULL,
    total_lessons_held INT NOT NULL DEFAULT 0,
    total_justified_absences INT NOT NULL DEFAULT 0,
    billable_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    gross_amount NUMERIC(10, 2) NOT NULL,
    bonus_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    deduction_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_payout NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL', -- PENDING, APPROVED, PAID
    paid_at TIMESTAMPTZ,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categorias e Lançamentos de Fluxo de Caixa (DRE Operacional)
CREATE TABLE cashflow_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type cashflow_type_enum NOT NULL,
    description TEXT
);

CREATE TABLE cashflow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES cashflow_categories(id) ON DELETE SET NULL,
    type cashflow_type_enum NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    teacher_payout_id UUID REFERENCES teacher_payouts(id) ON DELETE SET NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. TRIGGER DE CONCESSÃO AUTOMÁTICA DE CRÉDITO DE REPOSIÇÃO
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_issue_makeup_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'JUSTIFIED_ABSENCE', gera crédito de reposição com 90 dias de validade
    IF NEW.status = 'JUSTIFIED_ABSENCE' AND (OLD.status IS NULL OR OLD.status != 'JUSTIFIED_ABSENCE') THEN
        INSERT INTO makeup_credits (
            student_id,
            attendance_id,
            credit_code,
            reason,
            issue_date,
            expiration_date,
            status
        ) VALUES (
            NEW.student_id,
            NEW.id,
            'CRD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
            COALESCE(NEW.justification_notes, 'Falta Justificada pelo Aluno/Responsável'),
            NEW.lesson_date,
            NEW.lesson_date + INTERVAL '90 days',
            'AVAILABLE'
        );

        -- Atualiza saldo do aluno
        UPDATE students
        SET makeup_balance = makeup_balance + 1
        WHERE id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_makeup_credit
AFTER INSERT OR UPDATE ON attendances
FOR EACH ROW
EXECUTE FUNCTION fn_trg_issue_makeup_credit();
`;
