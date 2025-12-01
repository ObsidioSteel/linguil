# linguil

## About

***linguil*** is the daily language guessing game.

## Technical overview

- *Next.js*-based web application
- **Frontend:** *Tailwind CSS* (styling), *Radix* (UI) & *Recharts* (custom user leaderboards)
- **Backend:** *Google Cloud* (compute), *Firebase* (authentication, storage, hosting, performance monitoring, analytics) & *Stripe* (linguil+ payments)

## Guide: Add a new language

1. Check the [language wishlist](http://github.com/linguil/linguil/wiki/Language-Wishlist) for currently supported and unsupported languages (supported languages are ~~crossed out~~ as well as listed in ```public/data/MultiLangFamilies.csv```).

2. Choose a language to add (languages need not be on the wishlist, but must be well-attested in academic literature; have some scholarly consensus around their top-level language family; and currently have speakers—no creoles, conlangs or dead languages).

3. Record its top-level language family at the bottom of ```public/data/MultiLangFamilies.csv``` in the correct style:  
<div align=center>
  
  ```[Language],[Family]```.
  
</div>

4. Choose the most appropriate Google Text-to-Speech (TTS) voice name from [this list](http://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types) (the most similar language if yours is unavailable) and record it at the bottom of ```public/data/LanguageCodes.csv``` in the correct style (note the language code must match the TTS name code):  
<div align=center>
  
  ```[Language],[LanguageCode],[TTSVoiceName]```.

</div>

6. Record the approx. total number of global speakers (L1 + L2); the country (and state/province if the country is large) with the most speakers; and the approx. total number of speakers in that country (L1 + L2) at the bottom of ```public/data/LangStats.csv``` in the correct style:  
<div align=center>
  
  ```[Language],~[# GlobalSpeakers],[Country (State / Province),~[# CountrySpeakers]```.

</div>

7. Record each word in the 100-word Swadesh list both in the original native script (if available) and transliterated into the Latin script (letters + diacritics only) at the end of each row of ```public/data/MultiLangSwadesh.csv``` in the correct style:  
<div align=center>
  
  ```,[NativeScript] ([LatinScript])```.

</div>

8. Submit your changes to the [```linguil```](https://github.com/linguil/linguil) repo for approval.

___


<div align=right>
  
  Created by ***Charlie McCombie ([@Papuang](https://github.com/Papuang/))***
  
</div>
