import { jsPDF } from 'jspdf';
import { resolveArchivoUrl } from './archivos';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtShortDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function imprimirHistoriaClinicaPDF(mascota) {
  if (!mascota) return false;
  const win = window.open('', '_blank', 'width=960,height=800');
  if (!win) return false;

  const fotoUrl = mascota.fotoUrl ? resolveArchivoUrl(mascota.fotoUrl) : '';
  const historial = mascota.historial || [];
  const procedimientos = mascota.procedimientos || [];
  const hospitalizaciones = mascota.hospitalizaciones || [];

  const consultasHtml = historial.length
    ? historial
        .map((h) => {
          const recetasHtml =
            h.recetas && h.recetas.length
              ? `<div class="receta-box">
                  <div class="field-label">Receta Médica / Medicamentos Formulados</div>
                  ${h.recetas
                    .map(
                      (rec) => `
                      <ul class="med-list">
                        ${(rec.medicamentos || [])
                          .map(
                            (m) => `<li><strong>${escapeHtml(m.nombre)}</strong>${
                              m.presentacion ? ` (${escapeHtml(m.presentacion)})` : ''
                            } — ${escapeHtml(m.dosis)}${
                              m.frecuencia ? ` • ${escapeHtml(m.frecuencia)}` : ''
                            }${m.duracion ? ` • ${escapeHtml(m.duracion)}` : ''}${
                              m.instrucciones ? `<br/><span class="muted">${escapeHtml(m.instrucciones)}</span>` : ''
                            }</li>`
                          )
                          .join('')}
                      </ul>
                      ${
                        rec.indicaciones_generales
                          ? `<p class="muted" style="margin-top:4px;"><em>Indicaciones: ${escapeHtml(rec.indicaciones_generales)}</em></p>`
                          : ''
                      }`
                    )
                    .join('')}
                </div>`
              : '';

          return `
            <div class="record">
              <div class="record-head">
                <div>
                  <strong>${escapeHtml(fmtDate(h.fecha))}</strong>
                  <span class="muted"> • Consulta #${escapeHtml(h.id)}${h.cita_id ? ` • Cita #${escapeHtml(h.cita_id)}` : ''}</span>
                </div>
                <div class="vet">Dr(a). ${escapeHtml(h.veterinario_nombre)}</div>
              </div>
              <div class="record-body">
                <div class="field">
                  <div class="field-label">Motivo de consulta / Síntomas</div>
                  <div class="field-val"><strong>${escapeHtml(h.motivo)}</strong></div>
                </div>
                <div class="two-col">
                  <div class="field">
                    <div class="field-label">Diagnóstico médico</div>
                    <div class="field-val">${escapeHtml(h.diagnostico)}</div>
                  </div>
                  <div class="field accent-green">
                    <div class="field-label">Tratamiento y prescripción</div>
                    <div class="field-val">${escapeHtml(h.tratamiento)}</div>
                  </div>
                </div>
                ${
                  h.notas
                    ? `<div class="field accent-amber">
                        <div class="field-label">Observaciones clínicas / Evolución</div>
                        <div class="field-val">${escapeHtml(h.notas)}</div>
                      </div>`
                    : ''
                }
                ${recetasHtml}
              </div>
            </div>`;
        })
        .join('')
    : '<p class="empty">Sin consultas médicas registradas.</p>';

  const procsHtml = procedimientos.length
    ? procedimientos
        .map(
          (p) => `
          <div class="record">
            <div class="record-head">
              <div>
                <strong>${escapeHtml(p.tipo_procedimiento)}</strong>
                <span class="muted"> • ${escapeHtml(fmtDate(p.fecha))} • Proc. #${escapeHtml(p.id)}</span>
              </div>
              <div class="vet">Dr(a). ${escapeHtml(p.veterinario_nombre)}</div>
            </div>
            <div class="record-body">
              ${
                p.descripcion
                  ? `<div class="field"><div class="field-label">Descripción / Hallazgos</div><div class="field-val">${escapeHtml(p.descripcion)}</div></div>`
                  : ''
              }
              ${
                p.observaciones
                  ? `<div class="field accent-amber"><div class="field-label">Observaciones</div><div class="field-val">${escapeHtml(p.observaciones)}</div></div>`
                  : ''
              }
            </div>
          </div>`
        )
        .join('')
    : '<p class="empty">Sin procedimientos clínicos registrados.</p>';

  const hospsHtml = hospitalizaciones.length
    ? hospitalizaciones
        .map(
          (h) => `
          <div class="record">
            <div class="record-head">
              <div>
                <strong>Ingreso: ${escapeHtml(fmtDate(h.fecha_ingreso))}</strong>
                <span class="muted"> • ${h.fecha_egreso ? `Egreso: ${escapeHtml(fmtDate(h.fecha_egreso))}` : 'Estancia en curso'} • Estado: ${escapeHtml(h.estado)}</span>
              </div>
              <div class="vet">Dr(a). ${escapeHtml(h.veterinario_nombre)}</div>
            </div>
            <div class="record-body">
              <div class="field"><div class="field-label">Motivo de internación</div><div class="field-val"><strong>${escapeHtml(h.motivo)}</strong></div></div>
              ${
                h.tratamientos_realizados
                  ? `<div class="field accent-green"><div class="field-label">Tratamientos aplicados</div><div class="field-val">${escapeHtml(h.tratamientos_realizados)}</div></div>`
                  : ''
              }
              ${
                h.observaciones
                  ? `<div class="field accent-amber"><div class="field-label">Observaciones / Evolución</div><div class="field-val">${escapeHtml(h.observaciones)}</div></div>`
                  : ''
              }
            </div>
          </div>`
        )
        .join('')
    : '<p class="empty">Sin hospitalizaciones registradas.</p>';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Historia Clínica — ${escapeHtml(mascota.nombre)} (Expediente #${escapeHtml(mascota.id)})</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      font-size: 12px;
      line-height: 1.45;
      margin: 0;
      padding: 20px;
      background: #fff;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0369a1;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
    .brand span { color: #0369a1; }
    .doc-meta { text-align: right; font-size: 11px; color: #475569; }
    .patient-banner {
      display: flex;
      gap: 16px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 18px;
      background: #f8fafc;
    }
    .patient-photo {
      width: 76px;
      height: 76px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid #cbd5e1;
      flex-shrink: 0;
    }
    .patient-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 14px;
    }
    .kv-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
    .kv-val { font-size: 12px; font-weight: 600; color: #0f172a; }
    h2 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0369a1;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 18px 0 10px;
    }
    .record {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin-bottom: 10px;
      page-break-inside: avoid;
      overflow: hidden;
    }
    .record-head {
      background: #f1f5f9;
      padding: 7px 12px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }
    .vet { font-weight: 700; color: #0369a1; }
    .record-body { padding: 10px 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
    .field { margin-bottom: 6px; }
    .field-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin-bottom: 2px; }
    .field-val { white-space: pre-line; color: #1e293b; }
    .accent-green { border-left: 3px solid #059669; padding-left: 8px; }
    .accent-amber { border-left: 3px solid #d97706; padding-left: 8px; margin-top: 6px; }
    .receta-box { border-left: 3px solid #0284c7; padding-left: 8px; margin-top: 8px; }
    .med-list { margin: 2px 0 0 16px; padding: 0; }
    .med-list li { margin-bottom: 3px; }
    .muted { color: #64748b; font-size: 11px; }
    .empty { color: #64748b; font-style: italic; font-size: 11px; }
    .footer-sign {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: #64748b;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="brand">Data<span>Vet</span> — Historia Clínica Veterinaria</div>
      <div class="muted">Documento clínico oficial generado desde el sistema</div>
    </div>
    <div class="doc-meta">
      <div><strong>Expediente #${escapeHtml(mascota.id)}</strong></div>
      <div>Emisión: ${escapeHtml(fmtDate(new Date().toISOString()))}</div>
    </div>
  </div>

  <div class="patient-banner">
    ${fotoUrl ? `<img class="patient-photo" src="${escapeHtml(fotoUrl)}" alt="${escapeHtml(mascota.nombre)}" />` : ''}
    <div class="patient-grid">
      <div><div class="kv-label">Paciente</div><div class="kv-val">${escapeHtml(mascota.nombre)}</div></div>
      <div><div class="kv-label">Especie / Raza</div><div class="kv-val">${escapeHtml(mascota.especie)}${mascota.raza ? ` • ${escapeHtml(mascota.raza)}` : ''}</div></div>
      <div><div class="kv-label">Sexo / Peso</div><div class="kv-val">${escapeHtml(mascota.sexo || 'N/A')}${mascota.pesoKg ? ` • ${escapeHtml(mascota.pesoKg)} kg` : ''}</div></div>
      <div><div class="kv-label">Propietario</div><div class="kv-val">${escapeHtml(mascota.cliente?.nombre)}</div></div>
      <div><div class="kv-label">Documento / Teléfono</div><div class="kv-val">${mascota.cliente?.cedula ? `C.C. ${escapeHtml(mascota.cliente.cedula)}` : '—'}${mascota.cliente?.telefono ? ` • ${escapeHtml(mascota.cliente.telefono)}` : ''}</div></div>
      <div><div class="kv-label">Fecha Nacimiento</div><div class="kv-val">${escapeHtml(fmtShortDate(mascota.fechaNacimiento))}</div></div>
    </div>
  </div>

  <h2>1. Consultas Médicas y Evolución (${historial.length})</h2>
  ${consultasHtml}

  <h2>2. Procedimientos Clínicos y Exámenes (${procedimientos.length})</h2>
  ${procsHtml}

  <h2>3. Hospitalizaciones e Internaciones (${hospitalizaciones.length})</h2>
  ${hospsHtml}

  <div class="footer-sign">
    <span>DataVet Clínica Veterinaria • Expediente #${escapeHtml(mascota.id)}</span>
    <span>Firma / Sello Médico Veterinario: ___________________________</span>
  </div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

export function normalizarTelefonoWhatsApp(telefono) {
  const digits = String(telefono || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export function generarResumenHistoriaTexto(mascota, maxConsultas = 3) {
  if (!mascota) return '';
  const lineas = [
    `*HISTORIA CLÍNICA VETERINARIA — DATAVET*`,
    `Expediente #${mascota.id}`,
    `Paciente: ${mascota.nombre} (${mascota.especie}${mascota.raza ? ` - ${mascota.raza}` : ''})`,
    `Propietario: ${mascota.cliente?.nombre || '—'}`,
    '',
  ];

  const historial = (mascota.historial || []).slice(0, maxConsultas);
  if (historial.length > 0) {
    lineas.push(`*Últimas consultas médicas (${historial.length} de ${mascota.historial.length}):*`);
    for (const h of historial) {
      lineas.push(`• ${fmtShortDate(h.fecha)} — Dr(a). ${h.veterinario_nombre}`);
      lineas.push(`  Motivo: ${h.motivo}`);
      lineas.push(`  Diagnóstico: ${h.diagnostico}`);
      lineas.push(`  Tratamiento: ${h.tratamiento}`);
      if (h.recetas?.length) {
        for (const rec of h.recetas) {
          for (const m of rec.medicamentos || []) {
            lineas.push(`  Receta: ${m.nombre} — ${m.dosis}${m.frecuencia ? `, ${m.frecuencia}` : ''}${m.duracion ? ` (${m.duracion})` : ''}`);
          }
        }
      }
    }
    lineas.push('');
  }

  const procs = (mascota.procedimientos || []).slice(0, 3);
  if (procs.length > 0) {
    lineas.push(`*Procedimientos recientes:*`);
    for (const p of procs) {
      lineas.push(`• ${fmtShortDate(p.fecha)}: ${p.tipo_procedimiento}`);
    }
    lineas.push('');
  }

  const hospActiva = (mascota.hospitalizaciones || []).find((h) => h.estado === 'Activa');
  if (hospActiva) {
    lineas.push(`*Hospitalización activa:* ${hospActiva.motivo} (Ingreso: ${fmtShortDate(hospActiva.fecha_ingreso)})`);
  }

  return lineas.join('\n').trim();
}

export function crearDocumentoHistoriaPDF(mascota) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxW = pageW - margin * 2;
  let y = 18;

  const ensureSpace = (needed = 16) => {
    if (y + needed > pageH - 18) {
      doc.addPage();
      y = 18;
    }
  };

  const writeWrapped = (text, x, fontSize = 9.5, color = [30, 41, 59], style = 'normal', width = maxW) => {
    if (!text) return;
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text), width);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, x, y);
      y += fontSize * 0.45;
    }
  };

  // Encabezado oficial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('DataVet — Historia Clínica Veterinaria', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Expediente #${mascota.id}  •  Emisión: ${fmtDate(new Date().toISOString())}`, pageW - margin, y, {
    align: 'right',
  });
  y += 4;
  doc.setDrawColor(3, 105, 161);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // Ficha resumida del paciente y propietario
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, maxW, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${mascota.nombre} (${mascota.especie}${mascota.raza ? ` - ${mascota.raza}` : ''})`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Sexo: ${mascota.sexo || 'N/A'}   •   Peso: ${mascota.pesoKg ? `${mascota.pesoKg} kg` : 'N/A'}   •   Nacimiento: ${fmtShortDate(mascota.fechaNacimiento)}`,
    margin + 4,
    y + 12
  );
  doc.text(
    `Propietario: ${mascota.cliente?.nombre || '—'}   •   C.C. ${mascota.cliente?.cedula || '—'}   •   Tel: ${mascota.cliente?.telefono || '—'}`,
    margin + 4,
    y + 18
  );
  y += 31;

  const sectionTitle = (title) => {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(3, 105, 161);
    doc.text(title.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  // 1. Consultas médicas
  const historial = mascota.historial || [];
  sectionTitle(`1. Consultas Médicas y Evolución (${historial.length})`);
  if (historial.length === 0) {
    writeWrapped('Sin consultas médicas registradas.', margin, 9, [100, 116, 139], 'italic');
    y += 3;
  } else {
    for (const h of historial) {
      ensureSpace(22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${fmtDate(h.fecha)}  •  Consulta #${h.id}`, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(3, 105, 161);
      doc.text(`Dr(a). ${h.veterinario_nombre}`, pageW - margin, y, { align: 'right' });
      y += 4.5;

      writeWrapped(`Motivo / Síntomas: ${h.motivo}`, margin + 2, 9, [15, 23, 42], 'bold', maxW - 2);
      writeWrapped(`Diagnóstico: ${h.diagnostico}`, margin + 2, 9, [51, 65, 85], 'normal', maxW - 2);
      writeWrapped(`Tratamiento: ${h.tratamiento}`, margin + 2, 9, [6, 95, 70], 'normal', maxW - 2);
      if (h.notas) {
        writeWrapped(`Observaciones: ${h.notas}`, margin + 2, 8.5, [100, 116, 139], 'normal', maxW - 2);
      }
      if (h.recetas?.length) {
        for (const rec of h.recetas) {
          for (const m of rec.medicamentos || []) {
            writeWrapped(
              `Receta: ${m.nombre}${m.presentacion ? ` (${m.presentacion})` : ''} — ${m.dosis}${m.frecuencia ? ` • ${m.frecuencia}` : ''}${m.duracion ? ` • ${m.duracion}` : ''}`,
              margin + 4,
              8.5,
              [3, 105, 161],
              'normal',
              maxW - 4
            );
          }
        }
      }
      y += 2;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }
  }

  // 2. Procedimientos
  const procs = mascota.procedimientos || [];
  sectionTitle(`2. Procedimientos Clínicos y Exámenes (${procs.length})`);
  if (procs.length === 0) {
    writeWrapped('Sin procedimientos clínicos registrados.', margin, 9, [100, 116, 139], 'italic');
    y += 3;
  } else {
    for (const p of procs) {
      ensureSpace(16);
      writeWrapped(
        `${p.tipo_procedimiento}  •  ${fmtDate(p.fecha)}  •  Dr(a). ${p.veterinario_nombre}`,
        margin,
        9.5,
        [15, 23, 42],
        'bold'
      );
      if (p.descripcion) writeWrapped(p.descripcion, margin + 2, 9, [51, 65, 85], 'normal', maxW - 2);
      if (p.observaciones) writeWrapped(`Obs: ${p.observaciones}`, margin + 2, 8.5, [100, 116, 139], 'normal', maxW - 2);
      y += 2;
    }
  }

  // 3. Hospitalizaciones
  const hosps = mascota.hospitalizaciones || [];
  sectionTitle(`3. Hospitalizaciones e Internaciones (${hosps.length})`);
  if (hosps.length === 0) {
    writeWrapped('Sin hospitalizaciones registradas.', margin, 9, [100, 116, 139], 'italic');
  } else {
    for (const h of hosps) {
      ensureSpace(16);
      writeWrapped(
        `Ingreso: ${fmtDate(h.fecha_ingreso)}  •  Estado: ${h.estado}  •  Dr(a). ${h.veterinario_nombre}`,
        margin,
        9.5,
        [15, 23, 42],
        'bold'
      );
      writeWrapped(`Motivo: ${h.motivo}`, margin + 2, 9, [51, 65, 85], 'normal', maxW - 2);
      if (h.tratamientos_realizados) {
        writeWrapped(`Tratamientos: ${h.tratamientos_realizados}`, margin + 2, 9, [6, 95, 70], 'normal', maxW - 2);
      }
      if (h.observaciones) {
        writeWrapped(`Observaciones: ${h.observaciones}`, margin + 2, 8.5, [100, 116, 139], 'normal', maxW - 2);
      }
      y += 2;
    }
  }

  const safeName = (mascota.nombre || 'Mascota').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Historia_Clinica_${safeName}.pdf`;
  return { doc, fileName };
}

export function descargarHistoriaClinicaPDF(mascota) {
  if (!mascota) return null;
  const { doc, fileName } = crearDocumentoHistoriaPDF(mascota);
  doc.save(fileName);
  return fileName;
}
