import { classifyLoginIdentifier, validateRegistration } from './auth';

const VALID = { username: 'Ana_92', email: ' Ana@Example.com ', password: '123456', privacyAccepted: true };

describe('validateRegistration (RN-AUTH-02)', () => {
  it('acepta un registro válido y normaliza usuario y correo', () => {
    const result = validateRegistration(VALID);
    expect(result).toEqual({
      ok: true,
      value: { username: 'Ana_92', usernameNormalized: 'ana_92', email: 'ana@example.com', password: '123456' },
    });
  });

  it('contraseña: 5 caracteres no, 6 sí (límite)', () => {
    expect(validateRegistration({ ...VALID, password: '12345' }).ok).toBe(false);
    expect(validateRegistration({ ...VALID, password: '123456' }).ok).toBe(true);
  });

  it('exige aceptar el aviso de privacidad (C-25)', () => {
    const result = validateRegistration({ ...VALID, privacyAccepted: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.privacy).toBeDefined();
  });

  it('rechaza usuario con @ o espacios, y fuera de 3..20 caracteres', () => {
    for (const username of ['ana@x', 'ana maria', 'ab', 'a'.repeat(21)]) {
      expect(validateRegistration({ ...VALID, username }).ok).toBe(false);
    }
    expect(validateRegistration({ ...VALID, username: 'abc' }).ok).toBe(true);
    expect(validateRegistration({ ...VALID, username: 'a'.repeat(20) }).ok).toBe(true);
  });

  it('rechaza un correo inválido', () => {
    expect(validateRegistration({ ...VALID, email: 'ana.example.com' }).ok).toBe(false);
  });
});

describe('classifyLoginIdentifier (RN-AUTH-07)', () => {
  it('distingue correo y usuario, sin mayúsculas', () => {
    expect(classifyLoginIdentifier(' Ana@Example.com')).toEqual({ kind: 'EMAIL', value: 'ana@example.com' });
    expect(classifyLoginIdentifier('ANA_92')).toEqual({ kind: 'USERNAME', value: 'ana_92' });
  });
});
