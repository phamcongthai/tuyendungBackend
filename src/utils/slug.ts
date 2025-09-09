import slugify from 'slugify';
import { Model, Document } from 'mongoose';

export async function generateUniqueSlug<T extends Document>(
  model: Model<T>,
  title: string,
  currentId?: string
): Promise<string> {
  let baseSlug = slugify(title, { lower: true, strict: true, locale: 'vi' });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await model.findOne({
      slug,
      ...(currentId ? { _id: { $ne: currentId } } : {}),
    });
    if (!exists) break;
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
}
