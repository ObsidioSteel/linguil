# linguil

## 🔍 About

***[linguil](https://linguil.app)*** is the daily language guessing game. Guess the language family, language and meaning of a new word from the 100-word [Swadesh list](https://en.wikipedia.org/wiki/Swadesh_list) in a random language each day, add friends to your leaderboard, compete with your community on a Discord server, and add new languages to the game—all while learning about linguistics.

## ⚙️ Technical overview

- *Next.js*-based web application
- **Frontend:** *Tailwind CSS* (styling), *Radix* (UI) & *Recharts* (custom user leaderboards)
- **Backend:** *Google Cloud* (compute, TTS, Discord bot), *Firebase* (authentication, storage, hosting, performance monitoring, analytics) & *Stripe* (linguil+ payments)

## 📖 Guide: Add a new language

1. Check the [language wishlist](http://github.com/linguil/linguil/wiki/Language-Wishlist) for currently supported and unsupported languages (supported languages are ~~crossed out~~ as well as listed in [```public/data/MultiLangFamilies.csv```](https://github.com/linguil/linguil/blob/linguil/public/data/MultiLangFamilies.csv)).

2. Choose a language to add (languages need not be on the wishlist, but must be well-attested in academic literature; have some scholarly consensus around their top-level language family; and currently have speakers—no creoles, conlangs or dead languages).

3. Record its top-level language family at the bottom of [```public/data/MultiLangFamilies.csv```](https://github.com/linguil/linguil/blob/linguil/public/data/MultiLangFamilies.csv) in the correct style:  
<div align=center>
  
  ```[Language],[Family]```.
  
</div>

4. Choose the most appropriate Google Text-to-Speech (TTS) voice name from [this list](http://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types) (in order of priority, a voice in (i) your language; (ii) the most similar language using your language's native script; (iii) a language using a Latin-based script that includes the diacritics/additional letters your language uses when transliterated; (iv) an English dialect geographically closest to your language) and record it at the bottom of [```public/data/LanguageCodes.csv```](https://github.com/linguil/linguil/blob/linguil/public/data/LanguageCodes.csv) in the correct style (note the language code must match the TTS name code):  
<div align=center>
  
  ```[Language],[LanguageCode],[TTSVoiceName]```.

</div>

5. Record (i) the approx. total number of global speakers (L1 + L2); (ii) the country (and state/province(s) if the country is large) with the most speakers; and (iii) the approx. total number of speakers in that country (L1 + L2) at the bottom of [```public/data/LangStats.csv```](https://github.com/linguil/linguil/blob/linguil/public/data/LangStats.csv) in the correct style:  
<div align=center>
  
  ```[Language],~[# GlobalSpeakers],[Country (State / Province),~[# CountrySpeakers]```.

</div>

6. Record each word in the 100-word Swadesh list both in (i) the original native script (if available, or a standard alternative script if the dominant script is Latin-based) and (ii) transliterated into the Latin script (allowing novel letters, punctuation, and diacritics, but not tone numbers) at the end of each row of [```public/data/MultiLangSwadesh.csv```](https://github.com/linguil/linguil/blob/linguil/public/data/MultiLangSwadesh.csv) in the correct style:  
<div align=center>
  
  ```,[Native/AlternativeScript] ([LatinScript])``` or ```,[LatinScript]``` (if no alternative scripts are available).

</div>

7. Submit your changes to the [```linguil```](https://github.com/linguil/linguil) repo for approval (and earn linguil+ for free).

## 🌍 Community

### Discord
🕹️ **Game:** _[discord.com/activities/1473406949792940247](https://discord.com/activities/1473406949792940247)_ | 🌐 **Server:** _[discord.gg/p2GyWqVgea](https://discord.gg/p2GyWqVgea)_

🤖 **Bot commands:**
- _/setchannel [channel]_ — Set the channel where the bot will listen for and post linguil scores.
- _/leaderboard_ — View the current daily linguil leaderboard for this server.

### Reddit
🕹️ **Game:** _coming soon_ | 🗫 **Subreddit:** _[r/linguil](https://reddit.com/r/linguil)_

___

💡 Created by ***Charlie McCombie ([@Papuang](https://github.com/Papuang/))***

🫶 Supported by community contributors:
  
- ***Xeon ([@xeontheprotogen](http://github.com/xeontheprotogen))*** — Added Hungarian
- ***Shaheed Headley ([@ObsidioSteel](https://github.com/ObsidioSteel))*** — Added Finnish, Estonian, Czech & Slovak

___
