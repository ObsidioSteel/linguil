# linguil

## About

*linguil* is the daily language guessing game.

## Technical overview

- *Next.js*-based web application
- **Frontend:** *Tailwind CSS* (styling), *Radix* (UI) & *Recharts* (custom user leaderboards)
- **Backend:** *Google Cloud* (compute), *Firebase* (authentication, storage, hosting, performance monitoring, analytics) & *Stripe* (linguil+ payments)

## Guide: Contribute a new language

1. Check existing supported languages in ```public/data/MultiLangFamilies.csv```.

2. Check the new [language wishlist](http://github.com/Papuang/linguil/wiki/Language-Wishlist).

3. Choose a language to add—languages must be well-attested in academic literature and have some scholarly consensus around their top-level language family (no creoles, conlangs or languages without speakers).

4. Record its top-level language family at the bottom of ```public/data/MultiLangFamilies.csv``` in the correct style: ```[Language],[Family]```.

5. Choose the most appropriate Google Text-to-Speech (TTS) voice name from [this list](http://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types) (the most similar language if yours is unavailable) and record it at the bottom of ```public/data/LanguageCodes.csv``` in the correct style: ```[Language],[LanguageCode],[TTSVoiceName]```. Note the language code must match the TTS name code.

6. Record the approx. total number of global speakers (L1 + L2), the country (and state/province if large) with the most speakers, and the approx. total number of speakers in that country  (L1 + L2) at the bottom of ```public/data/LangStats.csv``` in the correct style: ```[Language],~[# GlobalSpeakers],[Country (State / Province),~[# CountrySpeakers]```

7. Record each word in the 100-word Swadesh list in both the original indigenous script (if available) and transliterated into the Latin script (letters + diacritics only) at the end of each row of ```public/data/MultiLangSwadesh.csv``` in the correct style: ```,[IndigenousScript] ([LatinScript])```.

8. Submit your changes to the [```linguil```](https://github.com/Papuang/linguil) repo for approval.
___


#### Created by *Charlie McCombie ([@Papuang](https://github.com/Papuang/))*
