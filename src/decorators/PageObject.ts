import 'reflect-metadata';
import { PAGE_OBJECT_WATERMARK } from '../constants';

/** Marks a class as a page object (cf. Nest's `@Injectable()` watermark). */
export function PageObject(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(PAGE_OBJECT_WATERMARK, true, target);
  };
}
