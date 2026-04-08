export interface TypographySettings {
  fontSize: number;
  dateXOffset: number;
  dateYOffset: number;
  dateFontSize: number;
  titleLetterSpacing: number;
  lineHeightFactor: number;
  imageXOffset: number;
  imageYOffset: number;
  titleXOffset: number;
  titleYOffset: number;
  layerOrder: string[];
}

export const loadTypographySettings = (): TypographySettings => {
  const template = localStorage.getItem('bg_selected_template') || 'PhotocardTemplate.png';
  const isRamadanEid = template === 'PhotocardTemplate1.png';
  const suffix = template === 'PhotocardTemplate.png' ? '' : `_${template}`;

  const getVal = (key: string, def: any) => {
    const saved = localStorage.getItem(`bg_${key}${suffix}`);
    return saved !== null ? saved : (localStorage.getItem(`bg_${key}`) || def);
  };

  const getDVal = (key: string, def: number | string, eidDef: number | string) => {
    const saved = localStorage.getItem(`bg_${key}${suffix}`);
    if (saved !== null) return saved;
    return isRamadanEid ? eidDef : (localStorage.getItem(`bg_${key}`) || def);
  };

  const defaultLayerOrder = isRamadanEid ? 'news_image,background,title_text,date_time' : 'background,news_image,date_time,title_text';
  const savedLayerOrder = getVal('layer_order', defaultLayerOrder);

  return {
    fontSize: Number(getDVal('font_size', 70, 57)),
    titleLetterSpacing: Number(getDVal('letter_spacing', -2.4, -0.6)),
    lineHeightFactor: Number(getDVal('line_height', 0.9, 1)),
    dateFontSize: Number(getDVal('date_font_size', 20, 19)),
    dateXOffset: Number(getDVal('date_x_offset', -40, -40)),
    dateYOffset: Number(getDVal('date_y_offset', -30, 18)),
    imageXOffset: Number(getDVal('image_x_offset', 0, 0)),
    imageYOffset: Number(getDVal('image_y_offset', 0, 25)),
    titleXOffset: Number(getDVal('title_x_offset', 0, 0)),
    titleYOffset: Number(getDVal('title_y_offset', 0, 35)),
    layerOrder: String(savedLayerOrder).split(',')
  };
};
