const Campaign = require('../models/Campaign');
const Account = require('../models/Account');
const { asyncHandler } = require('../utils/helpers');

exports.generateReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, campaignId, accountId, country, status } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (campaignId) filter._id = campaignId;
  if (accountId) filter.account = accountId;
  if (country) filter.country = country;
  if (status) filter.status = status;

  const campaigns = await Campaign.find(filter)
    .populate('account', 'accountName customerId')
    .populate('createdBy', 'name')
    .sort('-createdAt');

  const summary = {
    totalCampaigns: campaigns.length,
    totalBudget: campaigns.reduce((sum, c) => sum + c.dailyBudget, 0),
    byStatus: {},
    byType: {},
    byCountry: {}
  };

  campaigns.forEach(c => {
    summary.byStatus[c.status] = (summary.byStatus[c.status] || 0) + 1;
    summary.byType[c.campaignType] = (summary.byType[c.campaignType] || 0) + 1;
    summary.byCountry[c.country] = (summary.byCountry[c.country] || 0) + 1;
  });

  res.json({ success: true, data: { campaigns, summary } });
});

exports.exportReport = asyncHandler(async (req, res) => {
  const { format } = req.params;
  const { startDate, endDate, status, search, country } = req.query;

  const filter = {};
  if (startDate && endDate) filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  if (status) filter.status = status;
  if (country) filter.country = { $regex: country, $options: 'i' };
  if (search) filter.campaignName = { $regex: search, $options: 'i' };

  const campaigns = await Campaign.find(filter).populate('account', 'accountName').lean();

  if (format === 'pdf') {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.header('Content-Type', 'application/pdf');
    res.attachment('campaign-report.pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Campaign Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
      .text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.moveDown(0.5);

    // Summary cards
    const totalBudget = campaigns.reduce((s, c) => s + (c.dailyBudget || 0), 0);
    const activeCount = campaigns.filter(c => c.status === 'active').length;
    const pausedCount = campaigns.filter(c => c.status === 'paused').length;

    const summaryY = doc.y + 5;
    const cardW = 120;
    const cardH = 45;
    const cardGap = 15;
    const totalCardsW = cardW * 4 + cardGap * 3;
    const startX = (doc.page.width - totalCardsW) / 2;

    const summaryData = [
      { label: 'Total Campaigns', value: String(campaigns.length), color: '#3B82F6' },
      { label: 'Total Budget', value: `$${totalBudget}`, color: '#10B981' },
      { label: 'Active', value: String(activeCount), color: '#22C55E' },
      { label: 'Paused', value: String(pausedCount), color: '#F59E0B' },
    ];

    summaryData.forEach((card, i) => {
      const x = startX + i * (cardW + cardGap);
      doc.save();
      doc.roundedRect(x, summaryY, cardW, cardH, 4).fillAndStroke('#F9FAFB', '#E5E7EB');
      doc.restore();
      doc.fontSize(8).font('Helvetica').fillColor('#6B7280').text(card.label, x + 8, summaryY + 8, { width: cardW - 16 });
      doc.fontSize(16).font('Helvetica-Bold').fillColor(card.color).text(card.value, x + 8, summaryY + 22, { width: cardW - 16 });
    });

    doc.y = summaryY + cardH + 20;

    // Table
    const tableHeaders = ['#', 'Campaign Name', 'Account', 'Country', 'Budget', 'Status'];
    const colWidths = [25, 170, 100, 80, 65, 75];
    const tableX = 40;
    const rowH = 24;
    const headerH = 28;

    const drawTableHeader = (y) => {
      doc.save();
      doc.rect(tableX, y, colWidths.reduce((a, b) => a + b, 0), headerH).fill('#1E293B');
      doc.restore();

      let xPos = tableX;
      tableHeaders.forEach((header, i) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF')
          .text(header, xPos + 6, y + 9, { width: colWidths[i] - 12, align: i >= 4 ? 'center' : 'left' });
        xPos += colWidths[i];
      });

      return y + headerH;
    };

    let currentY = drawTableHeader(doc.y);

    campaigns.forEach((c, idx) => {
      if (currentY + rowH > doc.page.height - 50) {
        doc.addPage();
        currentY = drawTableHeader(40);
      }

      const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.save();
      doc.rect(tableX, currentY, colWidths.reduce((a, b) => a + b, 0), rowH).fill(bgColor);
      doc.restore();

      // Draw bottom border
      doc.save();
      doc.moveTo(tableX, currentY + rowH).lineTo(tableX + colWidths.reduce((a, b) => a + b, 0), currentY + rowH)
        .strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      doc.restore();

      const rowData = [
        String(idx + 1),
        c.campaignName || '-',
        c.account?.accountName || '-',
        c.country || '-',
        `$${c.dailyBudget || 0}`,
        (c.status || '-').charAt(0).toUpperCase() + (c.status || '-').slice(1),
      ];

      let xPos = tableX;
      rowData.forEach((cell, i) => {
        if (i === 5) {
          // Status badge
          const badgeColors = {
            Active: { bg: '#DCFCE7', text: '#166534' },
            Paused: { bg: '#FEF9C3', text: '#854D0E' },
            Ended: { bg: '#FEE2E2', text: '#991B1B' },
            Draft: { bg: '#F3F4F6', text: '#374151' },
          };
          const badge = badgeColors[cell] || badgeColors.Draft;
          const badgeW = 45;
          const badgeX = xPos + (colWidths[i] - badgeW) / 2;
          doc.save();
          doc.roundedRect(badgeX, currentY + 5, badgeW, 14, 3).fill(badge.bg);
          doc.restore();
          doc.fontSize(7).font('Helvetica-Bold').fillColor(badge.text)
            .text(cell, badgeX, currentY + 8, { width: badgeW, align: 'center' });
        } else {
          doc.fontSize(8).font(i === 1 ? 'Helvetica-Bold' : 'Helvetica').fillColor(i === 0 ? '#9CA3AF' : '#1F2937')
            .text(cell, xPos + 6, currentY + 7, { width: colWidths[i] - 12, align: i >= 4 ? 'center' : 'left' });
        }
        xPos += colWidths[i];
      });

      currentY += rowH;
    });

    // Footer
    doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF')
      .text('WarmFarm - Campaign Report', tableX, doc.page.height - 30, { align: 'center', width: doc.page.width - 80 });

    doc.end();
    return;
  }

  res.status(400).json({ success: false, message: 'Invalid format. Use pdf' });
});
