// load + validate clapper.config.json once, at module level. the parsed config
// is the defaultProps for every composition and the basis for the format list;
// a schema error here fails the bundle loudly rather than rendering garbage.

import raw from '../clapper.config.json';
import { configSchema, type Config } from './schema';

export const config: Config = configSchema.parse(raw);
