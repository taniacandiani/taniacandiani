import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { convert } from 'html-to-text';
import type { Project, ProjectTab } from '@/types';

// Register fonts (using default Helvetica family available in react-pdf)
const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingBottom: 70, // Extra space for footer
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    borderBottom: '2 solid #000',
    paddingBottom: 5,
  },
  subsectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 12,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metadataLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 140,
  },
  metadataValue: {
    flex: 1,
    color: '#333',
  },
  image: {
    marginVertical: 15,
    maxWidth: '100%',
    maxHeight: 400,
    objectFit: 'contain',
  },
  imageCaption: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  tabTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottom: '1 solid #000',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
});

interface ProjectPDFProps {
  project: Project;
  language: 'es' | 'en';
}

export const ProjectPDF: React.FC<ProjectPDFProps> = ({ project, language }) => {
  // Helper to get localized content
  const getContent = (field: keyof Project, fallback: string = ''): string => {
    if (language === 'en') {
      const enField = `${field}_en` as keyof Project;
      const enValue = project[enField];
      if (enValue && typeof enValue === 'string' && enValue.trim() !== '') {
        return enValue;
      }
    }
    const value = project[field];
    return (typeof value === 'string' ? value : fallback) || fallback;
  };

  // Helper to get tab content
  const getTabContent = (tab: ProjectTab, field: keyof ProjectTab, fallback: string = ''): string => {
    if (language === 'en') {
      const enField = `${field}_en` as keyof ProjectTab;
      const enValue = tab[enField];
      if (enValue && typeof enValue === 'string' && enValue.trim() !== '') {
        return enValue;
      }
    }
    const value = tab[field];
    return (typeof value === 'string' ? value : fallback) || fallback;
  };

  // Extract image URLs from HTML
  const extractImagesFromHtml = (html: string | undefined): string[] => {
    if (!html) return [];
    const images: string[] = [];

    // Try different patterns for img tags
    const patterns = [
      /<img[^>]+src="([^">]+)"/gi,  // Double quotes
      /<img[^>]+src='([^'>]+)'/gi,  // Single quotes
    ];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(html)) !== null) {
        const url = match[1];
        if (url && !images.includes(url)) {
          images.push(url);
        }
      }
    });

    console.log('[PDF] Extracted images from HTML:', images);
    return images;
  };

  // Remove iframes and images from HTML before converting to text
  const cleanHtml = (html: string | undefined): string => {
    if (!html) return '';
    let cleaned = html;

    // Remove video-wrapper divs with iframes (common pattern in TipTap)
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*video-wrapper[^"]*"[^>]*>.*?<\/div>/gis, '');

    // Remove standalone iframes (videos)
    cleaned = cleaned.replace(/<iframe[^>]*>.*?<\/iframe>/gis, '');

    // Remove img tags (we extract these separately)
    cleaned = cleaned.replace(/<img[^>]*>/gi, '');

    return cleaned;
  };

  // Convert HTML to plain text
  const htmlToText = (html: string | undefined): string => {
    if (!html) return '';
    const cleaned = cleanHtml(html);
    return convert(cleaned, {
      wordwrap: 80,
      preserveNewlines: true,
      selectors: [
        { selector: 'p', format: 'block' },
        { selector: 'h1', format: 'block' },
        { selector: 'h2', format: 'block' },
        { selector: 'h3', format: 'block' },
        { selector: 'ul', format: 'block' },
        { selector: 'ol', format: 'block' },
        { selector: 'li', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
      ],
    });
  };

  const title = getContent('title');
  const technicalSheet = getContent('technicalSheet');
  const projectDetails = getContent('projectDetails');
  const commissionedBy = getContent('commissionedBy');
  const curator = getContent('curator');
  const location = getContent('location');

  // Extract images from project details HTML
  const projectDetailsImages = extractImagesFromHtml(projectDetails);

  // Combine hero images with images from project details
  const allProjectImages = [
    ...(project.heroImages || []),
    ...projectDetailsImages,
  ].filter((url, index, self) => url && self.indexOf(url) === index); // Remove duplicates

  console.log('[PDF] Project hero images:', project.heroImages);
  console.log('[PDF] Project details images:', projectDetailsImages);
  console.log('[PDF] All project images combined:', allProjectImages);

  // Labels based on language
  const labels = language === 'en' ? {
    technicalSheet: 'Technical Sheet',
    projectDetails: 'Project Details',
    information: 'Information',
    commissionedBy: 'Commissioned by',
    curator: 'Curator',
    location: 'Location',
    categories: 'Categories',
    year: 'Year',
    images: 'Images',
  } : {
    technicalSheet: 'Ficha Técnica',
    projectDetails: 'Detalles del Proyecto',
    information: 'Información',
    commissionedBy: 'Comisionado por',
    curator: 'Curador/a',
    location: 'Ubicación',
    categories: 'Categorías',
    year: 'Año',
    images: 'Imágenes',
  };

  return (
    <Document>
      {/* Main Content */}
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        {/* Technical Sheet */}
        {technicalSheet && (
          <View style={styles.section}>
            <Text style={styles.subsectionTitle}>{labels.technicalSheet}</Text>
            <Text style={styles.text}>{htmlToText(technicalSheet)}</Text>
          </View>
        )}

        {/* Project Details */}
        {projectDetails && (
          <View style={styles.section}>
            <Text style={styles.subsectionTitle}>{labels.projectDetails}</Text>
            <Text style={styles.text}>{htmlToText(projectDetails)}</Text>
          </View>
        )}

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>{labels.information}</Text>

          {commissionedBy && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>{labels.commissionedBy}:</Text>
              <Text style={styles.metadataValue}>{commissionedBy}</Text>
            </View>
          )}

          {curator && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>{labels.curator}:</Text>
              <Text style={styles.metadataValue}>{curator}</Text>
            </View>
          )}

          {location && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>{labels.location}:</Text>
              <Text style={styles.metadataValue}>{location}</Text>
            </View>
          )}

          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>{labels.year}:</Text>
            <Text style={styles.metadataValue}>{project.year}</Text>
          </View>

          {project.categories && project.categories.length > 0 && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>{labels.categories}:</Text>
              <Text style={styles.metadataValue}>{project.categories.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
      </Page>

      {/* Project Images (hero images + images from project details) */}
      {allProjectImages && allProjectImages.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.images}</Text>
          </View>
          {allProjectImages.map((imageUrl, index) => {
            const descriptions = language === 'en' && project.heroImageDescriptions_en
              ? project.heroImageDescriptions_en
              : project.heroImageDescriptions;
            const caption = descriptions?.[index];

            return (
              <View key={index} style={styles.section}>
                <Image src={imageUrl} style={styles.image} />
                {caption && <Text style={styles.imageCaption}>{caption}</Text>}
              </View>
            );
          })}

          {/* Footer */}
          <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
        </Page>
      )}

      {/* Additional Image */}
      {project.additionalImage && (
        <Page size="A4" style={styles.page}>
          <Image src={project.additionalImage} style={styles.image} />

          {/* Footer */}
          <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
        </Page>
      )}

      {/* Project Tabs */}
      {project.tabs && project.tabs.map((tab, tabIndex) => {
        const tabTitle = getTabContent(tab, 'title');
        const tabTechnicalSheet = getTabContent(tab, 'technicalSheet');
        const tabProjectDetails = getTabContent(tab, 'projectDetails');

        // Extract images from tab project details
        const tabDetailsImages = extractImagesFromHtml(tabProjectDetails);

        // Combine tab hero images with images from tab project details
        const allTabImages = [
          ...(tab.heroImages || []),
          ...tabDetailsImages,
        ].filter((url, index, self) => url && self.indexOf(url) === index);

        console.log(`[PDF] Tab "${tabTitle}" hero images:`, tab.heroImages);
        console.log(`[PDF] Tab "${tabTitle}" details images:`, tabDetailsImages);
        console.log(`[PDF] Tab "${tabTitle}" all images combined:`, allTabImages);

        return (
          <React.Fragment key={tab.id}>
            {/* Tab Content Page */}
            <Page size="A4" style={styles.page}>
              <Text style={styles.tabTitle}>{tabTitle}</Text>

              {/* Tab Technical Sheet */}
              {tabTechnicalSheet && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{labels.technicalSheet}</Text>
                  <Text style={styles.text}>{htmlToText(tabTechnicalSheet)}</Text>
                </View>
              )}

              {/* Tab Project Details */}
              {tabProjectDetails && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{labels.projectDetails}</Text>
                  <Text style={styles.text}>{htmlToText(tabProjectDetails)}</Text>
                </View>
              )}

              {/* Footer */}
              <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
            </Page>

            {/* Tab Images (hero images + images from tab details) */}
            {allTabImages && allTabImages.length > 0 && (
              <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{`${tabTitle} - ${labels.images}`}</Text>
                </View>
                {allTabImages.map((imageUrl, imgIndex) => {
                  const descriptions = language === 'en' && tab.heroImageDescriptions_en
                    ? tab.heroImageDescriptions_en
                    : tab.heroImageDescriptions;
                  const caption = descriptions?.[imgIndex];

                  return (
                    <View key={imgIndex} style={styles.section}>
                      <Image src={imageUrl} style={styles.image} />
                      {caption && <Text style={styles.imageCaption}>{caption}</Text>}
                    </View>
                  );
                })}

                {/* Footer */}
                <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
              </Page>
            )}

            {/* Tab Additional Image */}
            {tab.additionalImage && (
              <Page size="A4" style={styles.page}>
                <Image src={tab.additionalImage} style={styles.image} />

                {/* Footer */}
                <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
              </Page>
            )}
          </React.Fragment>
        );
      })}
    </Document>
  );
};
