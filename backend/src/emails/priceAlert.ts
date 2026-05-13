interface PriceAlertParams {
  vehicleLabel: string
  oldPrice: number
  newPrice: number
  referenceMonth: string
}

interface EmailContent {
  subject: string
  html: string
  text: string
}

export function buildPriceAlertEmail(params: PriceAlertParams): EmailContent {
  const { vehicleLabel, oldPrice, newPrice, referenceMonth } = params
  const oldFormatted = formatBRL(oldPrice)
  const newFormatted = formatBRL(newPrice)
  const diff = newPrice - oldPrice
  const diffFormatted = (diff >= 0 ? '+' : '') + formatBRL(Math.abs(diff))
  const direction = diff >= 0 ? 'subiu' : 'caiu'

  const subject = `Atualização de preço: ${vehicleLabel}`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:560px">
        <tr><td style="background:#c0392b;padding:24px 32px">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700">FIPE Fácil</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 8px;font-size:18px;color:#111">Atualização de preço</h1>
          <p style="margin:0 0 24px;color:#555;font-size:15px">${vehicleLabel}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:6px;overflow:hidden">
            <tr style="background:#f9f9f9">
              <td style="padding:12px 16px;color:#888;font-size:13px">Referência</td>
              <td style="padding:12px 16px;color:#111;font-size:13px;text-align:right">${referenceMonth}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#888;font-size:13px">Preço anterior</td>
              <td style="padding:12px 16px;color:#111;font-size:13px;text-align:right">${oldFormatted}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:12px 16px;color:#888;font-size:13px">Novo preço</td>
              <td style="padding:12px 16px;font-weight:700;font-size:15px;text-align:right;color:${diff >= 0 ? '#c0392b' : '#27ae60'}">${newFormatted}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#888;font-size:13px">Variação</td>
              <td style="padding:12px 16px;font-size:13px;text-align:right;color:${diff >= 0 ? '#c0392b' : '#27ae60'}">${diffFormatted} (${direction})</td>
            </tr>
          </table>
          <p style="margin:24px 0 0;color:#888;font-size:12px">
            Você está recebendo este email porque ativou notificações de preço no FIPE Fácil.
            Para desativar, acesse as configurações da sua conta.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `FIPE Fácil — Atualização de preço

Veículo: ${vehicleLabel}
Referência: ${referenceMonth}

Preço anterior: ${oldFormatted}
Novo preço:     ${newFormatted}
Variação:       ${diffFormatted} (${direction})

Para desativar notificações, acesse as configurações da sua conta em fipefacil.com.
`

  return { subject, html, text }
}

function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
