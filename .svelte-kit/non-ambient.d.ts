
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/calendar" | "/dashboard" | "/forums" | "/game-room" | "/home" | "/login" | "/matchmaking" | "/messages" | "/profile" | "/register" | "/settings" | "/social" | "/tournaments";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/calendar": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/forums": Record<string, never>;
			"/game-room": Record<string, never>;
			"/home": Record<string, never>;
			"/login": Record<string, never>;
			"/matchmaking": Record<string, never>;
			"/messages": Record<string, never>;
			"/profile": Record<string, never>;
			"/register": Record<string, never>;
			"/settings": Record<string, never>;
			"/social": Record<string, never>;
			"/tournaments": Record<string, never>
		};
		Pathname(): "/" | "/calendar" | "/calendar/" | "/dashboard" | "/dashboard/" | "/forums" | "/forums/" | "/game-room" | "/game-room/" | "/home" | "/home/" | "/login" | "/login/" | "/matchmaking" | "/matchmaking/" | "/messages" | "/messages/" | "/profile" | "/profile/" | "/register" | "/register/" | "/settings" | "/settings/" | "/social" | "/social/" | "/tournaments" | "/tournaments/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}