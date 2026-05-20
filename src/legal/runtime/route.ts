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
			kind: 'exact-case';
			ref: {
				ah: string;
			};
	  }
	| {
			kind: 'fuzzy-case';
			query: string;
	  }
	| {
			kind: 'none';
	  };
