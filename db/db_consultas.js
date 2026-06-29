const { createClient } = require('@supabase/supabase-js');

if (process.env.NODE_TLS_ALLOW_SELF_SIGNED === 'true' || process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('WARNING: TLS certificate validation is disabled');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = class DBRepository {
  async getUsuarios() {
    const { data, error } = await supabase
      .from('Usuarios')
      .select('username, contraseña');

    return { data, error };
  }

  async getUserByUsername(input) {
    const { data, error } = await supabase
      .from('Usuarios')
      .select('username')
      .eq('username', input);

    return { data, error };
  }
};
