#!/usr/bin/env python3
"""Generate a sample company document PDF for testing the RAG pipeline."""
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.utils import simpleSplit
    
    c = canvas.Canvas("sample_company_doc.pdf", pagesize=A4)
    width, height = A4

    text = """CallPilot AI - Sample Company Document

Company: Sharma Dental Clinic
Location: Andheri West, Mumbai

Services Offered:
- General Dentistry (consultation, checkups, X-rays)
- Root Canal Treatment (RCT) by experienced endodontists
- Teeth Whitening (laser and custom tray options)
- Dental Implants (single tooth to full mouth)
- Braces & Orthodontics (metal, ceramic, and Invisalign)
- Teeth Cleaning (scaling and polishing)
- Children's Dentistry (pediatric care)
- Emergency Dental Care (same-day appointments available)

Operating Hours:
Monday - Saturday: 9:00 AM to 8:00 PM
Sunday: 10:00 AM to 2:00 PM

Contact Information:
Phone: +91 98765 43210
Email: care@sharmaclinic.com
Address: Shop 12, Sunshine Plaza, Andheri West, Mumbai - 400053

Pricing (approximate):
- Consultation: Rs. 500
- Teeth Cleaning: Rs. 1,500 - Rs. 3,000
- Root Canal: Rs. 5,000 - Rs. 10,000 per tooth
- Dental Implant: Rs. 25,000 - Rs. 50,000 per implant
- Braces: Rs. 30,000 - Rs. 60,000 (full treatment)
- Teeth Whitening: Rs. 8,000 - Rs. 15,000

Insurance: All major health insurance providers accepted.
EMI options available on treatments above Rs. 10,000.

Cancellation Policy:
- Free cancellation up to 4 hours before appointment time
- Late cancellation (less than 4 hours): Rs. 200 fee
- No-show: Full consultation charges apply

Follow-up visits: First follow-up is free within 7 days of treatment."""

    y = height - 50
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, "CallPilot AI - Sample Company Document")
    y -= 40
    
    c.setFont("Helvetica", 11)
    for line in text.split("\n"):
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 11)
        
        if line.startswith("Company:") or line.startswith("Location:") or line.startswith("Operating") or line.startswith("Contact") or line.startswith("Pricing") or line.startswith("Insurance") or line.startswith("Cancellation") or line.startswith("Follow-up"):
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y, line)
            c.setFont("Helvetica", 11)
        elif line.startswith("CallPilot"):
            pass  # Already printed header
        elif line.strip() == "":
            y -= 10
            continue
        else:
            c.drawString(50, y, line)
        
        y -= 18

    c.save()
    print("Created sample_company_doc.pdf successfully")

except ImportError:
    print("reportlab not installed. Creating a text file instead...")
    with open("sample_company_info.txt", "w", encoding="utf-8") as f:
        f.write("""CallPilot AI - Sample Company Information
=========================================

Company: Sharma Dental Clinic
Location: Andheri West, Mumbai

Services:
- General Dentistry
- Root Canal Treatment
- Teeth Whitening
- Dental Implants
- Braces & Orthodontics
- Teeth Cleaning

Hours: Mon-Sat 9AM-8PM, Sun 10AM-2PM
Phone: +91 98765 43210
Email: care@sharmaclinic.com

Pricing: Consultation Rs.500, Cleaning Rs.1500-3000, RCT Rs.5000-10000
Insurance accepted. EMI available.
""")
    print("Created sample_company_info.txt instead. Install reportlab for PDF: pip install reportlab")
