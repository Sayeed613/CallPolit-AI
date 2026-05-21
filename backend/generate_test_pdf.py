from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os

output_path = os.path.join(os.path.dirname(__file__), 'clinic_policies_brochure.pdf')

doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    topMargin=0.75*inch,
    bottomMargin=0.75*inch,
    leftMargin=0.75*inch,
    rightMargin=0.75*inch
)

styles = getSampleStyleSheet()

BLUE = HexColor('#2b6cb0')
DARK = HexColor('#1a365d')
GRAY = HexColor('#4a5568')
BODY = HexColor('#2d3748')
LIGHT_GRAY = HexColor('#cbd5e0')
DIM = HexColor('#718096')

title_style = ParagraphStyle('CustomTitle', parent=styles['Title'],
    fontSize=26, leading=32, spaceAfter=6, textColor=DARK, alignment=TA_CENTER)
subtitle_style = ParagraphStyle('SubTitle', parent=styles['Normal'],
    fontSize=14, leading=18, spaceAfter=24, textColor=GRAY, alignment=TA_CENTER)
section_style = ParagraphStyle('SectionHeader', parent=styles['Heading1'],
    fontSize=18, leading=24, spaceBefore=18, spaceAfter=10, textColor=BLUE)
body_style = ParagraphStyle('Body', parent=styles['Normal'],
    fontSize=10.5, leading=16, spaceAfter=8, alignment=TA_LEFT)
bullet_style = ParagraphStyle('BulletItem', parent=body_style,
    leftIndent=20, bulletIndent=10, spaceAfter=4)
pricing_style = ParagraphStyle('PricingCell', parent=body_style,
    fontSize=9.5, leading=13, spaceAfter=0, alignment=TA_CENTER)
pricing_left = ParagraphStyle('PricingCellLeft', parent=pricing_style, alignment=TA_LEFT)

elements = []

# ===== PAGE 1: Cover =====
elements.append(Spacer(1, 2*inch))
elements.append(Paragraph('Advanced Dental Care', title_style))
elements.append(Paragraph(
    'Complete Clinic Policies, Services &amp; Patient Information Guide',
    subtitle_style
))
elements.append(Spacer(1, 0.3*inch))

divider = Table([['']], colWidths=[5.5*inch], rowHeights=[2])
divider.setStyle(TableStyle([('LINEBELOW', (0,0), (-1,-1), 2, BLUE)]))
elements.append(divider)
elements.append(Spacer(1, 0.5*inch))

doc_info = [
    ['Clinic Name:', 'Advanced Dental Care Center'],
    ['Address:', '42 Health Boulevard, Suite 200, San Francisco, CA 94102'],
    ['Phone:', '(415) 555-0198'],
    ['Email:', 'info@advanceddentalcare.com'],
    ['Website:', 'www.advanceddentalcare.com'],
    ['Hours:', 'Mon-Fri 8:00 AM - 6:00 PM, Sat 9:00 AM - 3:00 PM'],
    ['Established:', '2012'],
    ['License:', 'CDA #CA-88492-DENT'],
]
info_table = Table(doc_info, colWidths=[1.5*inch, 4*inch])
info_table.setStyle(TableStyle([
    ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,-1), 11),
    ('TEXTCOLOR', (0,0), (0,-1), BLUE),
    ('TEXTCOLOR', (1,0), (1,-1), BODY),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
]))
elements.append(info_table)

elements.append(Spacer(1, 0.3*inch))
elements.append(Paragraph(
    '<i>This document serves as the official policies and procedures guide '
    'for all patients and staff members. Please retain for your records.</i>',
    ParagraphStyle('ItalicBody', parent=body_style, alignment=TA_CENTER, textColor=DIM)
))
elements.append(PageBreak())

# ===== PAGE 2: Services & Pricing =====
elements.append(Paragraph('1. Services &amp; Procedures', section_style))
elements.append(Paragraph(
    'Our clinic offers a comprehensive range of dental services utilizing '
    'state-of-the-art technology and modern techniques. All procedures are '
    'performed by licensed dentists with specialized training in their respective fields.',
    body_style
))
elements.append(Spacer(1, 0.15*inch))
elements.append(Paragraph(
    'General &amp; Preventive Dentistry',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
for item in [
    'Comprehensive oral examinations with digital X-rays',
    'Professional teeth cleaning (scaling and polishing)',
    'Fluoride treatments and dental sealants for cavity prevention',
    'Oral cancer screenings using VELscope technology',
    'Custom-fitted mouthguards for sports and bruxism',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph(
    'Restorative &amp; Cosmetic Dentistry',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
for item in [
    'Tooth-colored composite fillings (metal-free)',
    'Dental crowns, bridges, and veneers (same-day CEREC technology)',
    'Professional teeth whitening (Zoom! and take-home kits)',
    'Invisalign clear aligner orthodontics',
    'Dental implants (single, multi-unit, and All-on-4)',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.15*inch))

pricing_data = [
    [Paragraph('<b>Service</b>', pricing_left),
     Paragraph('<b>Code</b>', pricing_style),
     Paragraph('<b>Fee (No Insurance)</b>', pricing_style),
     Paragraph('<b>With Insurance</b>', pricing_style)],
    [Paragraph('Comprehensive Exam + X-rays', pricing_left), 'D0150+D0274', '$185', '$45 copay'],
    [Paragraph('Professional Cleaning (Adult)', pricing_left), 'D1110', '$150', '$35 copay'],
    [Paragraph('Composite Filling (1 surface)', pricing_left), 'D2391', '$250', '$65 copay'],
    [Paragraph('Dental Crown (Porcelain)', pricing_left), 'D2740', '$1,200', '$350 copay'],
    [Paragraph('Teeth Whitening (Zoom!)', pricing_left), 'D9975', '$550', '$275 copay'],
    [Paragraph('Invisalign (Full Treatment)', pricing_left), 'D8080', '$4,500', '$1,500 copay'],
    [Paragraph('Dental Implant + Crown', pricing_left), 'D6010+D6056', '$3,800', '$1,000 copay'],
    [Paragraph('Root Canal (Molar)', pricing_left), 'D3347', '$1,400', '$350 copay'],
    [Paragraph('Emergency Exam', pricing_left), 'D0140', '$99', '$25 copay'],
]
pricing_table = Table(pricing_data, colWidths=[2.3*inch, 1.0*inch, 1.1*inch, 1.1*inch])
pricing_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('FONTSIZE', (0,0), (-1,-1), 9.5),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('ALIGN', (0,0), (0,-1), 'LEFT'),
    ('GRID', (0,0), (-1,-1), 0.5, LIGHT_GRAY),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, HexColor('#f7fafc')]),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
elements.append(pricing_table)
elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph(
    '<i>* Fees are subject to change. Please verify with our billing department '
    'at the time of service.</i>',
    ParagraphStyle('Disclaimer', parent=body_style, fontSize=8.5, textColor=DIM, alignment=TA_CENTER)
))
elements.append(PageBreak())

# ===== PAGE 3: Patient Policies =====
elements.append(Paragraph('2. Patient Policies &amp; Procedures', section_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph(
    '2.1 Appointment Scheduling',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'Appointments can be scheduled by phone at (415) 555-0198, through our patient portal '
    'at www.advanceddentalcare.com/portal, or by visiting the clinic in person. We recommend '
    'scheduling routine cleanings at least two weeks in advance to secure preferred time slots. '
    'Emergency patients are accommodated on the same day whenever possible. New patient '
    'appointments should be scheduled at least 45 minutes to allow for comprehensive examination '
    'and records collection.',
    body_style
))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph(
    '2.2 Cancellation &amp; No-Show Policy',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'We require a minimum of 24 hours notice for all appointment cancellations or rescheduling. '
    'Patients who fail to provide 24-hour notice will be charged a cancellation fee of $50 for '
    'routine appointments and $100 for extended procedures (crowns, implants, root canals). '
    'Patients who do not show for their appointment without any prior notice will be charged the '
    'full cancellation fee and may be required to provide a deposit before scheduling future appointments.',
    body_style
))
for item in [
    'Same-day cancellations due to medical emergencies will be waived with proper documentation',
    'Two or more no-shows within a 12-month period may result in dismissal from the practice',
    'We will send appointment reminders via SMS and email 48 hours before your scheduled visit',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph(
    '2.3 Patient Privacy &amp; HIPAA Compliance',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'Advanced Dental Care Center is fully compliant with the Health Insurance Portability and '
    'Accountability Act (HIPAA) of 1996. We maintain strict confidentiality of all protected '
    'health information (PHI). Patients are required to sign a HIPAA authorization form during '
    'their first visit. We do not share patient information with third parties without explicit '
    'written consent, except as required by law.',
    body_style
))
for item in [
    'Patient records are stored digitally with AES-256 encryption',
    'Access to PHI is restricted to authorized personnel only',
    'Patients may request copies of their records at any time',
    'Our complete privacy policy is available on our website and at the front desk',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph(
    '2.4 Patient Rights &amp; Responsibilities',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'Patients have the right to receive clear, understandable information about their diagnosis, '
    'treatment options, and associated costs before any procedure begins. We practice informed '
    'consent for all treatments. Patients are responsible for providing accurate medical history '
    'information and following post-treatment care instructions provided by their dentist.',
    body_style
))
elements.append(PageBreak())

# ===== PAGE 4: Insurance & Billing =====
elements.append(Paragraph('3. Insurance &amp; Billing Information', section_style))
elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph(
    '3.1 Accepted Insurance Plans',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'We accept a wide range of dental insurance plans. Our billing team will verify your coverage '
    'and benefits before your first appointment. Below is a list of major insurance providers we '
    'work with:',
    body_style
))
for item in [
    'Delta Dental (Premier, PPO, and Medicare Advantage plans)',
    'Cigna Dental (PPO and DHMO networks)',
    'MetLife Dental (Fee-for-Service and PPO)',
    'Aetna Dental (PPO and Managed Care)',
    'Blue Shield of California Dental (PPO)',
    'Guardian Dental (PPO and Indemnity)',
    'Health Net Dental (PPO and HMO)',
    'Principal Financial Group',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph(
    'If your insurance provider is not listed above, please contact our billing department. '
    'We will do our best to work with your insurance company as a courtesy to you.',
    body_style
))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph(
    '3.2 Payment Options',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'For patients without insurance or for services not covered by insurance, we offer the '
    'following payment methods:',
    body_style
))
for item in [
    'Cash, check, or credit/debit card (Visa, Mastercard, American Express, Discover)',
    'CareCredit healthcare financing (0% interest for 6, 12, or 24 months on approved credit)',
    'In-house payment plans for treatments exceeding $1,000 (up to 6 monthly installments)',
    'Flexible Spending Account (FSA) and Health Savings Account (HSA) cards accepted',
    'Third-party financing through LendingClub patient solutions',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.15*inch))

payment_data = [
    [Paragraph('<b>Payment Method</b>', pricing_left),
     Paragraph('<b>Processing Time</b>', pricing_style),
     Paragraph('<b>Notes</b>', pricing_style)],
    ['Credit/Debit Card', 'Instant', 'All major cards accepted'],
    ['CareCredit', 'Pre-approval required', '0% interest promotions available'],
    ['In-house Plan', 'Same day approval', 'Requires 50% down payment'],
    ['FSA/HSA Card', 'Instant', 'Pre-tax savings accounts'],
    ['Cash/Check', 'At time of service', 'Receipt provided'],
]
payment_table = Table(payment_data, colWidths=[1.5*inch, 1.5*inch, 2.5*inch])
payment_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('FONTSIZE', (0,0), (-1,-1), 9.5),
    ('GRID', (0,0), (-1,-1), 0.5, LIGHT_GRAY),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, HexColor('#f7fafc')]),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
elements.append(payment_table)
elements.append(PageBreak())

# ===== PAGE 5: Emergency & Contact =====
elements.append(Paragraph('4. Emergency Procedures &amp; After-Hours Care', section_style))
elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph(
    '4.1 Dental Emergencies During Office Hours',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'If you are experiencing a dental emergency during regular business hours, please call our '
    'office immediately at (415) 555-0198. Our triage nurse will assess your situation and '
    'prioritize your care. Walk-in emergency patients are seen on a first-come, first-served '
    'basis. Common dental emergencies we treat include:',
    body_style
))
for item in [
    'Severe toothache or dental abscess',
    'Knocked-out (avulsed) tooth \u2014 time is critical, call immediately',
    'Cracked, fractured, or broken tooth',
    'Lost filling or crown',
    'Soft tissue injuries (cuts to gums, lips, tongue)',
    'Objects stuck between teeth causing pain',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.15*inch))
elements.append(Paragraph(
    '4.2 After-Hours Emergency Care',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'For dental emergencies that occur outside of our regular office hours, please call our '
    'emergency hotline at (415) 555-0199. This line is staffed by an on-call dentist from '
    '6:00 PM to 10:00 PM on weekdays and 9:00 AM to 3:00 PM on weekends. For life-threatening '
    'emergencies, please call 911 or visit the nearest hospital emergency room.',
    body_style
))
for item in [
    'Emergency hotline: (415) 555-0199 (available after hours)',
    'Average response time: under 15 minutes for urgent calls',
    'For severe facial swelling, difficulty breathing, or uncontrolled bleeding \u2014 call 911 immediately',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.15*inch))
elements.append(Paragraph(
    '4.3 Post-Treatment Care Guidelines',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'Following any dental procedure, patients should adhere to the following guidelines to ensure '
    'proper healing and optimal outcomes:',
    body_style
))
for item in [
    'Avoid eating or drinking for 30 minutes after any procedure involving local anesthesia',
    'For extractions: avoid using straws, spitting, or smoking for 72 hours to prevent dry socket',
    'For root canals: avoid chewing on the treated tooth until a permanent crown is placed',
    'For implants: maintain soft food diet for 7-10 days post-surgery',
    'For whitening: avoid staining foods (coffee, tea, red wine) for 48 hours',
    'Take prescribed medications exactly as directed, including any antibiotics',
    'Apply ice packs to the affected area for 20 minutes on, 20 minutes off to reduce swelling',
]:
    elements.append(Paragraph('\u2022 ' + item, bullet_style))

elements.append(Spacer(1, 0.15*inch))

elements.append(Paragraph('5. Contact Information &amp; Location', section_style))
elements.append(Spacer(1, 0.1*inch))

contact_data = [
    ['Department', 'Phone', 'Email', 'Hours'],
    ['Main Reception', '(415) 555-0198', 'info@advanceddentalcare.com', 'Mon-Fri 8AM-6PM'],
    ['Billing', '(415) 555-0197', 'billing@advanceddentalcare.com', 'Mon-Fri 9AM-5PM'],
    ['Emergency Hotline', '(415) 555-0199', 'emergency@advanceddentalcare.com', 'After hours'],
    ['Portal Support', '(415) 555-0196', 'portal@advanceddentalcare.com', '24/7 online'],
]
contact_table = Table(contact_data, colWidths=[1.3*inch, 1.2*inch, 2.0*inch, 1.5*inch])
contact_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('FONTSIZE', (0,0), (-1,-1), 9),
    ('GRID', (0,0), (-1,-1), 0.5, LIGHT_GRAY),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, HexColor('#f7fafc')]),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
elements.append(contact_table)

elements.append(Spacer(1, 0.3*inch))
elements.append(Paragraph(
    'Location',
    ParagraphStyle('Subsection', parent=section_style, fontSize=14, textColor=BODY)
))
elements.append(Paragraph(
    'Advanced Dental Care Center<br/>42 Health Boulevard, Suite 200<br/>'
    'San Francisco, CA 94102<br/><br/>'
    'Our facility is conveniently located on the corner of Health Boulevard and Market Street, '
    'with ample parking available in the attached parking structure. The building is wheelchair '
    'accessible with elevators to the second floor.',
    body_style
))
elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph(
    'Revision Date: January 15, 2026 | Version 3.2 | Next Review: July 2026',
    ParagraphStyle('Footer', parent=body_style, fontSize=8.5, textColor=HexColor('#a0aec0'), alignment=TA_CENTER)
))

doc.build(elements)
size = os.path.getsize(output_path)
print('OK: ' + output_path)
print('Size: {} bytes'.format(size))

# Verify pages
import pypdf
with open(output_path, 'rb') as f:
    reader = pypdf.PdfReader(f)
    print('Pages: {}'.format(len(reader.pages)))
    total_chars = sum(len(p.extract_text() or '') for p in reader.pages)
    print('Total text chars: {}'.format(total_chars))
