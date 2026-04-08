import { TypographySettings } from "./settings";
import { getSelectedAd } from "./db";
import { fetchImageWithProxy } from "./api";

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1080;
export const BOX = { x: 30, y: 32, w: 1020, h: 574 };
const GRAY_BAR_Y = 660;
const GRAY_BAR_H = 85;
const DATE_X = 88;
const DATE_Y = GRAY_BAR_Y + (GRAY_BAR_H / 2);
const TITLE_X = CANVAS_WIDTH / 2;
const TITLE_Y = 860;

const formatDate = (date: Date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]} | ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const generatePhotoCardInternal = async (
  canvas: HTMLCanvasElement,
  targetTitle: string,
  targetImageUrl: string,
  settings: TypographySettings,
  imageCache: Map<string, HTMLImageElement>,
  forceProxy: boolean = false,
  manualHighlights?: number[]
): Promise<{ dataUrl: string, appliedHighlights: number[] }> => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  let appliedHighlightsResult: number[] = [];
  const templateName = localStorage.getItem('bg_selected_template') || 'PhotocardTemplate.png';

  const getCachedImage = async (src: string, isData = false): Promise<HTMLImageElement> => {
    if (imageCache.has(src)) return imageCache.get(src)!;
    const img = new Image();
    if (!isData) img.crossOrigin = "anonymous";
    img.src = src;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    imageCache.set(src, img);
    return img;
  };

  const template = await getCachedImage(`/${templateName}`);

  let adImg: HTMLImageElement | null = null;
  const selectedAdId = localStorage.getItem('bg_selected_ad');
  if (selectedAdId) {
    const adData = await getSelectedAd(selectedAdId);
    if (adData) {
      adImg = await getCachedImage(adData.data, true);
    }
  }

  const adHeight = adImg ? (CANVAS_WIDTH / adImg.width) * adImg.height : 0;
  canvas.height = CANVAS_HEIGHT + adHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const userImgBlobUrl = (targetImageUrl.startsWith('blob:') || targetImageUrl.startsWith('data:')) ? targetImageUrl : await fetchImageWithProxy(targetImageUrl, forceProxy);
  const userImg = new Image();
  userImg.src = userImgBlobUrl;
  await new Promise(r => { userImg.onload = r; });

  const scale = Math.max(BOX.w / userImg.width, BOX.h / userImg.height);
  const drawW = userImg.width * scale, drawH = userImg.height * scale;
  const drawX = BOX.x + (BOX.w - drawW) / 2 + settings.imageXOffset, drawY = BOX.y + (BOX.h - drawH) / 2 + settings.imageYOffset;
  const boxX = BOX.x + settings.imageXOffset, boxY = BOX.y + settings.imageYOffset;

  const renderLayers: Record<string, () => void> = {
    background: () => {
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (adImg) ctx.drawImage(adImg, 0, CANVAS_HEIGHT, CANVAS_WIDTH, adHeight);
    },
    news_image: () => {
      const radius = 35;
      const definePath = () => {
        ctx.beginPath();
        ctx.moveTo(boxX + radius, boxY); ctx.lineTo(boxX + BOX.w - radius, boxY);
        ctx.quadraticCurveTo(boxX + BOX.w, boxY, boxX + BOX.w, boxY + radius);
        ctx.lineTo(boxX + BOX.w, boxY + BOX.h - radius);
        ctx.quadraticCurveTo(boxX + BOX.w, boxY + BOX.h, boxX + BOX.w - radius, boxY + BOX.h);
        ctx.lineTo(boxX + radius, boxY + BOX.h);
        ctx.quadraticCurveTo(boxX, boxY + BOX.h, boxX, boxY + BOX.h - radius);
        ctx.lineTo(boxX, boxY + radius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
        ctx.closePath();
      };
      ctx.save(); definePath(); ctx.clip(); ctx.drawImage(userImg, drawX, drawY, drawW, drawH); ctx.restore();
      ctx.save(); definePath(); ctx.lineWidth = 2; ctx.strokeStyle = '#FF0000'; ctx.stroke(); ctx.restore();
    },
    date_time: () => {
      ctx.font = `${settings.dateFontSize}px "Cambria"`; ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(formatDate(new Date()), DATE_X + settings.dateXOffset, DATE_Y + settings.dateYOffset);
    },
    title_text: () => {
      const highlightColor = localStorage.getItem('bg_highlight_color') || '#FFFF00';
      let curFS = settings.fontSize; ctx.textAlign = 'center'; ctx.letterSpacing = `${settings.titleLetterSpacing}px`;
      const allWords = targetTitle.split(' ');
      let lines: { text: string; wordIndices: number[] }[] = [];

      for (let i = 0; i < 10; i++) {
        ctx.font = `bold ${curFS}px "Cambria"`;
        lines = [];
        let currentLineText = '';
        let currentLineIndices: number[] = [];

        for (let j = 0; j < allWords.length; j++) {
          const word = allWords[j];
          const testLine = currentLineText ? currentLineText + ' ' + word : word;
          if (ctx.measureText(testLine).width > 980 && currentLineText !== '') {
            lines.push({ text: currentLineText, wordIndices: currentLineIndices });
            currentLineText = word;
            currentLineIndices = [j];
          } else {
            currentLineText = testLine;
            currentLineIndices.push(j);
          }
        }
        lines.push({ text: currentLineText, wordIndices: currentLineIndices });

        if (lines.length <= 3 && Math.max(...lines.map(l => ctx.measureText(l.text).width)) <= 980) break;
        curFS *= 0.9;
      }

      const lh = curFS * settings.lineHeightFactor;
      let appliedHighlights = manualHighlights;
      const autoHighlightEnabled = localStorage.getItem('bg_auto_highlight_two_lines') !== 'false';

      if (!appliedHighlights && lines.length === 2 && autoHighlightEnabled) {
        appliedHighlights = lines[0].wordIndices;
      }
      if (!appliedHighlights) appliedHighlights = [];
      appliedHighlightsResult = appliedHighlights;

      lines.forEach((line, i) => {
        const totalWidth = ctx.measureText(line.text).width;
        let currentX = TITLE_X + settings.titleXOffset - totalWidth / 2;
        const y = TITLE_Y + settings.titleYOffset - ((lines.length - 1) * lh / 2) + (i * lh);

        ctx.textAlign = 'left';
        line.wordIndices.forEach((wordIdx, idxInLine) => {
          const word = allWords[wordIdx];
          ctx.fillStyle = appliedHighlights!.includes(wordIdx) ? highlightColor : 'white';
          ctx.fillText(word, currentX, y);
          currentX += ctx.measureText(word).width;
          if (idxInLine < line.wordIndices.length - 1) {
            currentX += ctx.measureText(' ').width;
          }
        });
      });
    }
  };

  settings.layerOrder.forEach(layer => {
    if (renderLayers[layer]) renderLayers[layer]();
  });

  if (userImgBlobUrl.startsWith('blob:') && userImgBlobUrl !== targetImageUrl) URL.revokeObjectURL(userImgBlobUrl);
  return { dataUrl: canvas.toDataURL('image/png'), appliedHighlights: appliedHighlightsResult };
};
