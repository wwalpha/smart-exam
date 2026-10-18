export const getReviewMaterialGroupKey = (material: {
  materialId?: string | null;
  grade?: string | null;
  provider?: string | null;
  materialDate?: string | null;
  materialName?: string | null;
}): string => {
  return [material.materialId, material.grade, material.provider, material.materialDate, material.materialName]
    .map((value) => value ?? '')
    .join('||');
};

export const compareReviewMaterialDateDesc = (
  a: { materialDate?: string | null },
  b: { materialDate?: string | null },
): number => {
  const aDate = a.materialDate ?? '';
  const bDate = b.materialDate ?? '';
  return aDate === bDate ? 0 : aDate > bDate ? -1 : 1;
};
