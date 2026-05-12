import { LegalRef } from '../detector';

export type LegalCommandRoute =
	| {
			kind: 'exact-provision';
			ref: LegalRef;
	  }
	| {
			kind: 'fuzzy-provision';
			query: string;
	  }
	| {
			kind: 'none';
	  };
