import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { convert } from 'html-to-text';
import type { Project, ProjectTab } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 55,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  imagePage: {
    padding: 40,
    paddingBottom: 55,
    fontFamily: 'Helvetica',
    fontSize: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.3,
    marginBottom: 8,
    borderBottom: '2 solid #000',
    paddingBottom: 6,
  },
  subsectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    marginTop: 4,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metadataLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 120,
    fontSize: 10,
  },
  metadataValue: {
    flex: 1,
    color: '#333',
    fontSize: 10,
  },
  imageContainer: {
    marginVertical: 4,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  imageFull: {
    maxWidth: '100%',
    maxHeight: 620,
    objectFit: 'contain',
  },
  imageHalf: {
    maxWidth: '100%',
    maxHeight: 310,
    objectFit: 'contain',
  },
  imageCaption: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  tabTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.3,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1 solid #000',
  },
  logoContainer: {
    marginBottom: 12,
    width: '100%',
  },
  logo: {
    fontSize: 20,
    fontFamily: 'Helvetica',
    letterSpacing: 3,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
  videoLink: {
    fontSize: 9,
    color: '#333',
    marginBottom: 2,
  },
  videoSection: {
    marginTop: 6,
    marginBottom: 4,
  },
  videoTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
});

interface ProjectPDFProps {
  project: Project;
  language: 'es' | 'en';
}

interface ImageWithCaption {
  url: string;
  caption?: string;
}

// Group images in pairs of 2 per page
function groupImages(images: ImageWithCaption[]): ImageWithCaption[][] {
  if (images.length === 0) return [];
  if (images.length === 1) return [images];
  const groups: ImageWithCaption[][] = [];
  for (let i = 0; i < images.length; i += 2) {
    groups.push(images.slice(i, i + 2));
  }
  return groups;
}

// Deduplicate captions: only show a caption if it hasn't been shown before in this image set
function deduplicateCaptions(images: ImageWithCaption[]): ImageWithCaption[] {
  const seenCaptions = new Set<string>();
  return images.map(img => {
    if (img.caption) {
      const normalized = img.caption.trim().toLowerCase();
      if (seenCaptions.has(normalized)) {
        return { url: img.url }; // Remove duplicate caption
      }
      seenCaptions.add(normalized);
    }
    return img;
  });
}

export const ProjectPDF: React.FC<ProjectPDFProps> = ({ project, language }) => {
  // Debug timestamp to verify code version
  console.log('[PDF] Generating PDF with updated code v3 -', new Date().toISOString());

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

  const extractImagesFromHtml = (html: string | undefined): string[] => {
    if (!html) return [];
    const images: string[] = [];
    const patterns = [
      /<img[^>]+src="([^">]+)"/gi,
      /<img[^>]+src='([^'>]+)'/gi,
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
    return images;
  };

  // Aggressively clean HTML before converting to text
  const cleanHtml = (html: string | undefined): string => {
    if (!html) return '';
    let cleaned = html;

    // Remove video-wrapper divs with iframes
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*video-wrapper[^"]*"[^>]*>.*?<\/div>/gis, '');
    // Remove standalone iframes
    cleaned = cleaned.replace(/<iframe[^>]*>.*?<\/iframe>/gis, '');
    // Remove img tags
    cleaned = cleaned.replace(/<img[^>]*\/?>/gi, '');
    // Remove empty paragraphs (various TipTap patterns)
    cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<p[^>]*>\s*<br[^>]*\/?>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<p[^>]*>\s*&nbsp;\s*<\/p>/gi, '');
    // Remove standalone <br> tags that create extra whitespace
    cleaned = cleaned.replace(/(<br\s*\/?>){2,}/gi, '<br>');
    // Remove empty divs
    cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, '');

    return cleaned;
  };

  const htmlToText = (html: string | undefined): string => {
    if (!html) return '';
    const cleaned = cleanHtml(html);
    if (!cleaned.trim()) return '';

    const text = convert(cleaned, {
      wordwrap: false,
      preserveNewlines: false,
      selectors: [
        { selector: 'p', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'h1', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'h2', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'h3', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'ul', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'ol', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'li', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'br', format: 'skip' },
        { selector: 'div', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
      ],
    });
    // Collapse 2+ consecutive newlines into a single newline
    return text.replace(/\n{2,}/g, '\n').trim();
  };

  const title = getContent('title');
  const technicalSheet = getContent('technicalSheet');
  const projectDetails = getContent('projectDetails');
  const credits = getContent('credits');
  const commissionedBy = getContent('commissionedBy');
  const curator = getContent('curator');
  const location = getContent('location');

  // Build images with captions for the main project
  const projectDetailsImages = extractImagesFromHtml(projectDetails);
  const heroImages = project.heroImages || [];
  const heroDescriptions = language === 'en' && project.heroImageDescriptions_en
    ? project.heroImageDescriptions_en
    : project.heroImageDescriptions;

  const rawProjectImages: ImageWithCaption[] = [];
  const seenUrls = new Set<string>();

  heroImages.forEach((url, index) => {
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      rawProjectImages.push({ url, caption: heroDescriptions?.[index] });
    }
  });

  projectDetailsImages.forEach(url => {
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      rawProjectImages.push({ url });
    }
  });

  // Deduplicate captions and group
  const allProjectImagesWithCaptions = deduplicateCaptions(rawProjectImages);
  const projectImagePages = groupImages(allProjectImagesWithCaptions);

  // Project-level videos only
  const projectVideos = project.videoUrls && project.videoUrls.length > 0
    ? project.videoUrls : [];

  const labels = language === 'en' ? {
    technicalSheet: 'Technical Sheet',
    projectDetails: 'Project Details',
    credits: 'Credits',
    information: 'Information',
    commissionedBy: 'Commissioned by',
    curator: 'Curator',
    location: 'Location',
    categories: 'Categories',
    year: 'Year',
    images: 'Images',
    videos: 'Videos',
  } : {
    technicalSheet: 'Ficha Técnica',
    projectDetails: 'Detalles del Proyecto',
    credits: 'Créditos',
    information: 'Información',
    commissionedBy: 'Comisionado por',
    curator: 'Curador/a',
    location: 'Ubicación',
    categories: 'Categorías',
    year: 'Año',
    images: 'Imágenes',
    videos: 'Videos',
  };

  const renderVideoLinks = (videoUrls: string[]) => {
    if (!videoUrls || videoUrls.length === 0) return null;
    return (
      <View style={styles.videoSection}>
        <Text style={styles.videoTitle}>{labels.videos}</Text>
        {videoUrls.map((videoUrl, urlIndex) => (
          <Text key={urlIndex} style={styles.videoLink}>• {videoUrl}</Text>
        ))}
      </View>
    );
  };

  const getImageStyle = (count: number) => {
    return count <= 1 ? styles.imageFull : styles.imageHalf;
  };

  // Helper: build tab images with deduped captions
  const buildTabImages = (tab: ProjectTab, tabProjectDetails: string) => {
    const tabDetailsImages = extractImagesFromHtml(tabProjectDetails);
    const tabHeroImages = tab.heroImages || [];
    const tabHeroDescriptions = language === 'en' && tab.heroImageDescriptions_en
      ? tab.heroImageDescriptions_en
      : tab.heroImageDescriptions;

    const rawImages: ImageWithCaption[] = [];
    const tabSeenUrls = new Set<string>();

    tabHeroImages.forEach((url, index) => {
      if (url && !tabSeenUrls.has(url)) {
        tabSeenUrls.add(url);
        rawImages.push({ url, caption: tabHeroDescriptions?.[index] });
      }
    });

    tabDetailsImages.forEach(url => {
      if (url && !tabSeenUrls.has(url)) {
        tabSeenUrls.add(url);
        rawImages.push({ url });
      }
    });

    return deduplicateCaptions(rawImages);
  };

  return (
    <Document>
      {/* Page 1: Main Content */}
      <Page size="A4" style={styles.page}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>TANIA CANDIANI</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        {technicalSheet && htmlToText(technicalSheet) && (
          <View style={styles.section}>
            <Text style={styles.subsectionTitle}>{labels.technicalSheet}</Text>
            <Text style={styles.text}>{htmlToText(technicalSheet)}</Text>
          </View>
        )}

        {projectDetails && htmlToText(projectDetails) && (
          <View style={styles.section}>
            <Text style={styles.subsectionTitle}>{labels.projectDetails}</Text>
            <Text style={styles.text}>{htmlToText(projectDetails)}</Text>
          </View>
        )}

        {credits && htmlToText(credits) && (
          <View style={styles.section}>
            <Text style={styles.subsectionTitle}>{labels.credits}</Text>
            <Text style={styles.text}>{htmlToText(credits)}</Text>
          </View>
        )}

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

        <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
      </Page>

      {/* Project Images - 2 per page */}
      {projectImagePages.map((imageGroup, pageIndex) => (
        <Page key={`img-${pageIndex}`} size="A4" style={styles.imagePage}>
          {pageIndex === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{labels.images}</Text>
            </View>
          )}
          {imageGroup.map((img, imgIndex) => (
            <View key={imgIndex} style={styles.imageContainer}>
              <Image src={img.url} style={getImageStyle(imageGroup.length)} />
              {img.caption && <Text style={styles.imageCaption}>{img.caption}</Text>}
            </View>
          ))}
          {/* Project videos after last image page */}
          {pageIndex === projectImagePages.length - 1 && projectVideos.length > 0 && (
            renderVideoLinks(projectVideos)
          )}
          <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
        </Page>
      ))}

      {/* Project videos if no images */}
      {projectImagePages.length === 0 && projectVideos.length > 0 && (
        <Page size="A4" style={styles.page}>
          {renderVideoLinks(projectVideos)}
          <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
        </Page>
      )}

      {/* Additional Image */}
      {project.additionalImage && (
        <Page size="A4" style={styles.imagePage}>
          <View style={styles.imageContainer}>
            <Image src={project.additionalImage} style={styles.imageFull} />
          </View>
          <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
        </Page>
      )}

      {/* Tabs */}
      {project.tabs && project.tabs.map((tab) => {
        const tabTitle = getTabContent(tab, 'title');
        const tabTechnicalSheet = getTabContent(tab, 'technicalSheet');
        const tabProjectDetails = getTabContent(tab, 'projectDetails');
        const tabCredits = getTabContent(tab, 'credits');

        const tabImagesWithCaptions = buildTabImages(tab, tabProjectDetails);
        const tabImagePages = groupImages(tabImagesWithCaptions);
        const tabVideos = tab.videoUrls && tab.videoUrls.length > 0 ? tab.videoUrls : [];
        const hasImages = tabImagePages.length > 0;

        return (
          <React.Fragment key={tab.id}>
            {/* Tab Content */}
            <Page size="A4" style={styles.page}>
              <Text style={styles.tabTitle}>{tabTitle}</Text>

              {tabTechnicalSheet && htmlToText(tabTechnicalSheet) && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{labels.technicalSheet}</Text>
                  <Text style={styles.text}>{htmlToText(tabTechnicalSheet)}</Text>
                </View>
              )}

              {tabProjectDetails && htmlToText(tabProjectDetails) && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{labels.projectDetails}</Text>
                  <Text style={styles.text}>{htmlToText(tabProjectDetails)}</Text>
                </View>
              )}

              {tabCredits && htmlToText(tabCredits) && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{labels.credits}</Text>
                  <Text style={styles.text}>{htmlToText(tabCredits)}</Text>
                </View>
              )}

              {/* Videos on content page if no images */}
              {!hasImages && tabVideos.length > 0 && renderVideoLinks(tabVideos)}

              <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
            </Page>

            {/* Tab Images - 2 per page */}
            {tabImagePages.map((imageGroup, pageIndex) => (
              <Page key={`tab-img-${pageIndex}`} size="A4" style={styles.imagePage}>
                {pageIndex === 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{`${tabTitle} - ${labels.images}`}</Text>
                  </View>
                )}
                {imageGroup.map((img, imgIndex) => (
                  <View key={imgIndex} style={styles.imageContainer}>
                    <Image src={img.url} style={getImageStyle(imageGroup.length)} />
                    {img.caption && <Text style={styles.imageCaption}>{img.caption}</Text>}
                  </View>
                ))}
                {/* Tab videos after last image page */}
                {pageIndex === tabImagePages.length - 1 && tabVideos.length > 0 && (
                  renderVideoLinks(tabVideos)
                )}
                <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
              </Page>
            ))}

            {/* Tab Additional Image */}
            {tab.additionalImage && (
              <Page size="A4" style={styles.imagePage}>
                <View style={styles.imageContainer}>
                  <Image src={tab.additionalImage} style={styles.imageFull} />
                </View>
                <Text style={styles.footer} fixed>© TANIA CANDIANI</Text>
              </Page>
            )}
          </React.Fragment>
        );
      })}
    </Document>
  );
};
