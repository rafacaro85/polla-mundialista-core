const updateCRM = async () => {
  const r = await fetch('/api/v1/workflows/mWAPm8qajiAFoqbH');
  const wf = await r.json();

  // 1. Corrección SQL: Agrupar por usuario
  const sqlNode = wf.nodes.find(n => n.name === 'Traer Usuarios y Ligas' || n.type === 'n8n-nodes-base.postgres');
  if (sqlNode) {
    sqlNode.parameters.query = `
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  u.created_at AS user_created_at,
  u.welcome_email_sent,
  json_agg(
    json_build_object(
      'league_id', l.id,
      'package_type', l.package_type,
      'status', l.status
    )
  ) FILTER (WHERE l.id IS NOT NULL) AS leagues
FROM users u
LEFT JOIN leagues l ON l.creator_id = u.id
WHERE u.email IS NOT NULL
  AND u.email != ''
  AND u.deleted_at IS NULL
GROUP BY u.id
    `.trim();
  }

  // 2. Corrección JS: Mayúsculas, iterar sobre el array y proteger duplicates
  const jsNode = wf.nodes.find(n => n.name === 'Determinar Segmento');
  if (jsNode) {
    jsNode.parameters.jsCode = `
const item = $input.item.json;
const now = new Date();
const d = Math.floor((now - new Date(item.user_created_at)) / 86400000);
const todayValidDays = [1, 3, 7];

// Si no tiene pollas creadas
if (!item.leagues || item.leagues.length === 0) {
  if (!todayValidDays.includes(d)) return null;
  return { json: { ...item, segment: 'no_league', daysSince: d } };
}

// 1. Free Upsell
const hasFree = item.leagues.some(l => ['starter', 'FREE', 'launch_promo', 'ENTERPRISE_LAUNCH', 'free'].includes(l.package_type));
if (hasFree) {
  if (d % 3 !== 0 || d === 0) return null;
  return { json: { ...item, segment: 'free_upsell', daysSince: d } };
}

// 2. Pending Premium (Carrito Abandonado)
const hasPendingPaid = item.leagues.some(l => !['starter', 'FREE', 'launch_promo', 'ENTERPRISE_LAUNCH', 'free'].includes(l.package_type) && l.status === 'PENDING');
if (hasPendingPaid) {
  if (!todayValidDays.includes(d)) return null;
  return { json: { ...item, segment: 'abandoned_cart', daysSince: d } };
}

// 3. Active Premium (Welcome)
const hasActivePaid = item.leagues.some(l => !['starter', 'FREE', 'launch_promo', 'ENTERPRISE_LAUNCH', 'free'].includes(l.package_type) && l.status === 'ACTIVE');
if (hasActivePaid && !item.welcome_email_sent) {
  return { json: { ...item, segment: 'welcome_active', daysSince: d } };
}

return null;
    `.trim();
  }

  // 3. Ajuste de Timezone en los Settings
  wf.settings = wf.settings || {};
  wf.settings.timezone = "America/Bogota"; 
  
  // El cron se queda igual (0 10 * * *) pero ahora tomará la franja de Colombia
  const cronNode = wf.nodes.find(n => n.name === '🗓️ Cron Diario' || n.type === 'n8n-nodes-base.scheduleTrigger');
  if (cronNode && cronNode.parameters && cronNode.parameters.rule) {
    cronNode.parameters.rule = {
        interval: [{
            field: "cronExpression",
            expression: "0 10 * * *"
        }]
    };
  }

  const putPayload = {
    name: wf.name,
    active: wf.active,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings,
    versionId: wf.versionId
  };

  const resp = await fetch('/api/v1/workflows/mWAPm8qajiAFoqbH', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(putPayload)
  });
  
  const result = await resp.json();
  console.log('✅ Workflow actualizado de raíz. Respuesta:', result);
};

updateCRM();
