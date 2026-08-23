// src/pages/Home.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import homeData from "../data/HomePageData.json";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleDropdown = (section: string) => {
    setOpenDropdown(openDropdown === section ? null : section);
  };

  const styles = {
    homeContainer: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#1a202c",
      backgroundColor: "#f7fafc",
      minHeight: "100vh",
    },

    // NAVBAR
    navbar: {
      backgroundColor: "#ffffff",
      padding: "16px 40px",
      display: "flex" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      borderBottom: "1px solid #e2e8f0",
      position: "sticky" as const,
      top: 0,
      zIndex: 100,
    },
    logo: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#1a202c",
      letterSpacing: "-0.5px",
      cursor: "pointer",
    },
    navLinks: {
      display: "flex" as const,
      gap: "32px",
      listStyle: "none",
      margin: 0,
      padding: 0,
    },
    navLink: {
      color: "#4a5568",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: 500,
      cursor: "pointer",
      transition: "color 0.2s",
    },
    btnLogin: {
      backgroundColor: "#2b6cb0",
      color: "#ffffff",
      border: "none",
      padding: "8px 24px",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s",
    },

    // HERO
    hero: {
      padding: "80px 40px",
      backgroundColor: "#f7fafc",
      display: "flex" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      minHeight: "70vh",
    },
    heroContent: {
      maxWidth: "1200px",
      width: "100%",
      display: "grid" as const,
      gridTemplateColumns: "1fr 1fr",
      gap: "60px",
      alignItems: "center" as const,
    },
    heroText: {
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: "16px",
    },
    heroTitle: {
      fontSize: "42px",
      fontWeight: 800,
      lineHeight: "1.1",
      color: "#1a202c",
      letterSpacing: "-1.5px",
      margin: 0,
    },
    heroHighlight: {
      color: "#2b6cb0",
    },
    heroDescription: {
      fontSize: "17px",
      color: "#4a5568",
      lineHeight: "1.7",
      maxWidth: "500px",
      margin: 0,
    },
    heroButtons: {
      display: "flex" as const,
      gap: "12px",
      marginTop: "8px",
      flexWrap: "wrap" as const,
    },
    btnPrimary: {
      backgroundColor: "#2b6cb0",
      color: "#ffffff",
      border: "none",
      padding: "12px 32px",
      borderRadius: "4px",
      fontSize: "15px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    btnSecondary: {
      backgroundColor: "transparent",
      color: "#2b6cb0",
      border: "2px solid #2b6cb0",
      padding: "10px 30px",
      borderRadius: "4px",
      fontSize: "15px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s",
    },
    heroVisual: {
      display: "grid" as const,
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },
    heroCard: {
      backgroundColor: "#ffffff",
      padding: "28px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    },
    heroCardAccent: {
      backgroundColor: "#2b6cb0",
      padding: "28px",
      borderRadius: "8px",
      color: "#ffffff",
    },
    heroCardTitle: {
      fontSize: "17px",
      fontWeight: 600,
      marginBottom: "6px",
      marginTop: 0,
    },
    heroCardAccentTitle: {
      fontSize: "17px",
      fontWeight: 600,
      marginBottom: "6px",
      marginTop: 0,
      color: "#ffffff",
    },
    heroCardText: {
      fontSize: "14px",
      lineHeight: "1.6",
      color: "#4a5568",
      margin: 0,
    },
    heroCardAccentText: {
      fontSize: "14px",
      lineHeight: "1.6",
      color: "#bee3f8",
      margin: 0,
    },

    // FEATURES - DROPDOWN
    features: {
      padding: "80px 40px",
      backgroundColor: "#ffffff",
    },
    featuresContainer: {
      maxWidth: "900px",
      margin: "0 auto",
    },
    sectionTitle: {
      textAlign: "center" as const,
      fontSize: "32px",
      fontWeight: 700,
      color: "#1a202c",
      marginBottom: "8px",
      letterSpacing: "-0.5px",
    },
    sectionSubtitle: {
      textAlign: "center" as const,
      fontSize: "17px",
      color: "#4a5568",
      maxWidth: "700px",
      margin: "0 auto 48px auto",
      lineHeight: "1.6",
    },
    dropdownContainer: {
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: "10px",
      maxWidth: "800px",
      margin: "0 auto",
    },
    dropdownItem: {
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      backgroundColor: "#ffffff",
      overflow: "hidden",
    },
    dropdownHeader: {
      padding: "16px 20px",
      cursor: "pointer",
      display: "flex" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      backgroundColor: "#f7fafc",
      fontWeight: 500,
      fontSize: "15px",
      color: "#1a202c",
    },
    dropdownArrow: {
      fontSize: "14px",
      color: "#2b6cb0",
      transition: "transform 0.2s ease",
    },
    dropdownArrowOpen: {
      transform: "rotate(180deg)",
    },
    dropdownContent: {
      padding: "0 20px 20px 20px",
      borderTop: "1px solid #e2e8f0",
      backgroundColor: "#ffffff",
    },
    dropdownText: {
      fontSize: "14px",
      color: "#4a5568",
      lineHeight: "1.7",
      marginTop: "16px",
    },
    dropdownList: {
      listStyle: "none",
      padding: 0,
      margin: "10px 0 0 0",
    },
    dropdownListItem: {
      fontSize: "14px",
      color: "#4a5568",
      padding: "5px 0",
      borderBottom: "1px solid #f0efed",
      lineHeight: "1.6",
    },
    dropdownListItemLast: {
      fontSize: "14px",
      color: "#4a5568",
      padding: "5px 0",
      borderBottom: "none",
      lineHeight: "1.6",
    },

    // WHO CAN USE
    whoCanUse: {
      padding: "80px 40px",
      backgroundColor: "#f7fafc",
    },
    whoCanUseContainer: {
      maxWidth: "1000px",
      margin: "0 auto",
    },
    whoCanUseGrid: {
      display: "grid" as const,
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "32px",
      marginTop: "40px",
    },
    whoCanUseCard: {
      backgroundColor: "#ffffff",
      padding: "28px 24px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
    },
    whoCanUseCardTitle: {
      fontSize: "17px",
      fontWeight: 600,
      color: "#1a202c",
      marginBottom: "10px",
    },
    whoCanUseCardList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    whoCanUseCardItem: {
      fontSize: "14px",
      color: "#4a5568",
      padding: "5px 0",
      borderBottom: "1px solid #f0efed",
      lineHeight: "1.6",
    },
    whoCanUseCardItemLast: {
      fontSize: "14px",
      color: "#4a5568",
      padding: "5px 0",
      borderBottom: "none",
      lineHeight: "1.6",
    },

    // CUSTOMIZATION
    customization: {
      padding: "80px 40px",
      backgroundColor: "#ffffff",
    },
    customizationContainer: {
      maxWidth: "800px",
      margin: "0 auto",
      textAlign: "center" as const,
    },
    customizationGrid: {
      display: "grid" as const,
      gridTemplateColumns: "1fr 1fr",
      gap: "32px",
      marginTop: "40px",
    },
    customizationCard: {
      backgroundColor: "#f7fafc",
      padding: "28px 24px",
      borderRadius: "8px",
      textAlign: "left" as const,
    },
    customizationCardTitle: {
      fontSize: "17px",
      fontWeight: 600,
      color: "#1a202c",
      marginBottom: "8px",
    },
    customizationCardText: {
      fontSize: "14px",
      color: "#4a5568",
      lineHeight: "1.6",
      margin: 0,
    },

    // ABOUT
    about: {
      padding: "80px 40px",
      backgroundColor: "#f7fafc",
    },
    aboutContainer: {
      maxWidth: "800px",
      margin: "0 auto",
    },
    aboutText: {
      fontSize: "16px",
      lineHeight: "1.8",
      color: "#2d3748",
      marginBottom: "20px",
    },

    // STEPS
    steps: {
      padding: "80px 40px",
      backgroundColor: "#ffffff",
    },
    stepsContainer: {
      maxWidth: "1000px",
      margin: "0 auto",
    },
    stepsGrid: {
      display: "grid" as const,
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "40px",
    },
    step: {
      textAlign: "center" as const,
      padding: "20px",
    },
    stepNumber: {
      backgroundColor: "#2b6cb0",
      color: "#ffffff",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      fontSize: "18px",
      fontWeight: 700,
      margin: "0 auto 16px auto",
    },
    stepTitle: {
      fontSize: "17px",
      fontWeight: 600,
      color: "#1a202c",
      marginBottom: "8px",
    },
    stepText: {
      fontSize: "14px",
      color: "#4a5568",
      lineHeight: "1.6",
      margin: 0,
    },

    // CTA
    cta: {
      padding: "80px 40px",
      backgroundColor: "#2b6cb0",
      color: "#ffffff",
      textAlign: "center" as const,
    },
    ctaContainer: {
      maxWidth: "650px",
      margin: "0 auto",
    },
    ctaTitle: {
      fontSize: "32px",
      fontWeight: 700,
      marginBottom: "12px",
      letterSpacing: "-0.5px",
    },
    ctaText: {
      fontSize: "17px",
      opacity: 0.9,
      lineHeight: "1.7",
      marginBottom: "32px",
    },
    ctaBtn: {
      backgroundColor: "#ffffff",
      color: "#2b6cb0",
      border: "none",
      padding: "14px 44px",
      borderRadius: "4px",
      fontSize: "15px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s",
    },

    // CONTACT - FREE DEMO
    contactSection: {
      padding: "40px 40px 60px 40px",
      backgroundColor: "#2b6cb0",
      color: "#ffffff",
      textAlign: "center" as const,
      borderTop: "1px solid rgba(255,255,255,0.08)",
    },
    contactContainer: {
      maxWidth: "600px",
      margin: "0 auto",
    },
    contactTitle: {
      fontSize: "18px",
      fontWeight: 600,
      marginBottom: "10px",
      letterSpacing: "-0.3px",
    },
    contactEmail: {
      fontSize: "17px",
      color: "#ffffff",
      textDecoration: "none",
      fontWeight: 500,
      display: "inline-block",
      padding: "10px 28px",
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: "4px",
      transition: "background-color 0.2s",
      cursor: "pointer",
    },
    contactSub: {
      fontSize: "13px",
      opacity: 0.8,
      marginTop: "14px",
      marginBottom: 0,
    },

    // FOOTER
    footer: {
      backgroundColor: "#1a202c",
      color: "#a0aec0",
      padding: "40px 40px 20px",
    },
    footerContainer: {
      maxWidth: "1200px",
      margin: "0 auto",
    },
    footerContent: {
      display: "flex" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      flexWrap: "wrap" as const,
      gap: "24px",
      borderBottom: "1px solid #2d3748",
      paddingBottom: "24px",
      marginBottom: "24px",
    },
    footerBrand: {
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: "4px",
    },
    footerBrandTitle: {
      fontSize: "17px",
      fontWeight: 700,
      color: "#ffffff",
      letterSpacing: "-0.5px",
    },
    footerBrandSub: {
      fontSize: "13px",
      color: "#a0aec0",
      margin: 0,
    },
    footerLinks: {
      display: "flex" as const,
      gap: "24px",
      listStyle: "none",
      margin: 0,
      padding: 0,
      alignItems: "center" as const,
    },
    footerLink: {
      color: "#a0aec0",
      textDecoration: "none",
      fontSize: "13px",
      cursor: "pointer",
      transition: "color 0.2s",
      background: "none",
      border: "none",
      padding: 0,
    },
    footerBottom: {
      textAlign: "center" as const,
      fontSize: "13px",
      color: "#718096",
    },
  };

  const {
    navbar,
    hero,
    heroCards,
    features,
    whoCanUse,
    customization,
    about,
    steps,
    cta,
    contact,
    footer
  } = homeData;

  return (
    <div style={styles.homeContainer}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {navbar.logo}
        </div>
        <ul style={styles.navLinks}>
          {navbar.links.map((link: string) => (
            <li key={link}>
              <a
                style={styles.navLink}
                onClick={() => scrollToSection(link.toLowerCase().replace(/ /g, "-"))}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
        <button style={styles.btnLogin} onClick={() => navigate("/login")}>
          Login
        </button>
      </nav>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              {hero.title} <br />
              <span style={styles.heroHighlight}>{hero.highlight}</span>
            </h1>
            <p style={styles.heroDescription}>{hero.description}</p>
            <div style={styles.heroButtons}>
              <button style={styles.btnPrimary} onClick={() => navigate("/login")}>
                {hero.buttons.primary}
              </button>
              <button style={styles.btnSecondary} onClick={() => scrollToSection("features")}>
                {hero.buttons.secondary}
              </button>
            </div>
          </div>
          <div style={styles.heroVisual}>
            {heroCards.map((card: any, index: number) => (
              <div
                key={index}
                style={card.accent ? styles.heroCardAccent : styles.heroCard}
              >
                <h4 style={card.accent ? styles.heroCardAccentTitle : styles.heroCardTitle}>
                  {card.title}
                </h4>
                <p style={card.accent ? styles.heroCardAccentText : styles.heroCardText}>
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES - DROPDOWN */}
      <section id="features" style={styles.features}>
        <div style={styles.featuresContainer}>
          <h2 style={styles.sectionTitle}>{features.title}</h2>
          <p style={styles.sectionSubtitle}>{features.subtitle}</p>
          <div style={styles.dropdownContainer}>
            {features.items.map((item: any) => (
              <div key={item.id} style={styles.dropdownItem}>
                <div
                  style={styles.dropdownHeader}
                  onClick={() => toggleDropdown(item.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#edf2f7")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f7fafc")}
                >
                  <span>{item.title}</span>
                  <span style={{
                    ...styles.dropdownArrow,
                    ...(openDropdown === item.id ? styles.dropdownArrowOpen : {})
                  }}>
                    ▾
                  </span>
                </div>
                {openDropdown === item.id && (
                  <div style={styles.dropdownContent}>
                    <p style={styles.dropdownText}>{item.description}</p>
                    <ul style={styles.dropdownList}>
                      {item.details.map((detail: string, idx: number) => (
                        <li
                          key={idx}
                          style={idx === item.details.length - 1 ? styles.dropdownListItemLast : styles.dropdownListItem}
                        >
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO CAN USE */}
      <section id="who-can-use" style={styles.whoCanUse}>
        <div style={styles.whoCanUseContainer}>
          <h2 style={styles.sectionTitle}>{whoCanUse.title}</h2>
          <p style={styles.sectionSubtitle}>{whoCanUse.subtitle}</p>
          <div style={styles.whoCanUseGrid}>
            {whoCanUse.cards.map((card: any, index: number) => (
              <div key={index} style={styles.whoCanUseCard}>
                <h3 style={styles.whoCanUseCardTitle}>{card.title}</h3>
                <ul style={styles.whoCanUseCardList}>
                  {card.items.map((item: string, idx: number) => (
                    <li
                      key={idx}
                      style={idx === card.items.length - 1 ? styles.whoCanUseCardItemLast : styles.whoCanUseCardItem}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMIZATION */}
      <section id="customize" style={styles.customization}>
        <div style={styles.customizationContainer}>
          <h2 style={styles.sectionTitle}>{customization.title}</h2>
          <p style={styles.sectionSubtitle}>{customization.subtitle}</p>
          <div style={styles.customizationGrid}>
            {customization.cards.map((card: any, index: number) => (
              <div key={index} style={styles.customizationCard}>
                <h3 style={styles.customizationCardTitle}>{card.title}</h3>
                <p style={styles.customizationCardText}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={styles.about}>
        <div style={styles.aboutContainer}>
          <h2 style={styles.sectionTitle}>{about.title}</h2>
          {about.paragraphs.map((paragraph: string, index: number) => (
            <p
              key={index}
              style={styles.aboutText}
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section style={styles.steps}>
        <div style={styles.stepsContainer}>
          <h2 style={styles.sectionTitle}>{steps.title}</h2>
          <p style={styles.sectionSubtitle}>{steps.subtitle}</p>
          <div style={styles.stepsGrid}>
            {steps.items.map((item: any) => (
              <div key={item.number} style={styles.step}>
                <div style={styles.stepNumber}>{item.number}</div>
                <h3 style={styles.stepTitle}>{item.title}</h3>
                <p style={styles.stepText}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <div style={styles.ctaContainer}>
          <h2 style={styles.ctaTitle}>{cta.title}</h2>
          <p style={styles.ctaText}>{cta.text}</p>
          <button style={styles.ctaBtn} onClick={() => navigate("/login")}>
            {cta.button}
          </button>
        </div>
      </section>

      {/* CONTACT - FREE DEMO */}
      <section style={styles.contactSection}>
        <div style={styles.contactContainer}>
          <h3 style={styles.contactTitle}>{contact.title}</h3>
          <a
            href={`mailto:${contact.email}?subject=FICAS%20Demo%20Request&body=Hi%20there%2C%20I%20would%20like%20to%20request%20a%20free%20demo%20of%20FICAS.%20Please%20call%20me%20back%20to%20schedule%20a%20time.`}
            style={styles.contactEmail}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)")}
          >
            {contact.email}
          </a>
          <p style={styles.contactSub}>{contact.subtext}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerContent}>
            <div style={styles.footerBrand}>
              <span style={styles.footerBrandTitle}>{footer.brand}</span>
              <p style={styles.footerBrandSub}>{footer.sub}</p>
            </div>
            <ul style={styles.footerLinks}>
              {footer.links.map((link: string) => (
                <li key={link}>
                  {link === "Login" ? (
                    <button style={styles.footerLink} onClick={() => navigate("/login")}>
                      {link}
                    </button>
                  ) : (
                    <a
                      style={styles.footerLink}
                      onClick={() => scrollToSection(link.toLowerCase().replace(/ /g, "-"))}
                    >
                      {link}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div style={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} {footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;