## **v3.1.5**
#### 2024-01-02
- Bug: Fixed Missing Episodes not being displayed on Plex for Web version is 4.121.1
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.121.1
- Miscellaneous: Updated supported Local Plex for Web version to 4.118.0
- Miscellaneous: Added link to Discord

## **v3.1.4**
#### 2023-10-06
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.116.1

## **v3.1.3**
#### 2023-08-25
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.113.2
- Miscellaneous: Corrected a typo in the minimum required warning message
- Miscellaneous: Fixed the formatting of the links in the README file

## **v3.1.2**
#### 2023-07-14
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.110.1
- Miscellaneous: Updated supported Local Plex for Web version to 4.108.0

## **v3.1.1**
#### 2023-06-09
- Bug: Fixed an issue where clicking on the compatibility warning/error would inadvertantly send you back to the homepage
- Bug: Fixed an issue where the compatability warning would stop the extension when displayed

## **v3.1.0**
#### 2023-05-26
- Bug: Fixed an issue where the missing episodes plugin would ignore special seasons
- Bug: Fixed an issue where links would sometimes be inserted multiple times
- Enhancement: Restructured the options page to add better clarity
- Enhancement: Added support for locally hosted Plex (Plex Web 4.100.1)
- Enhancement: Added version checking for the latest tested version, compared to the installed/active version of Plex for Web
- Enhancement: Added a warning/error icon when there is a version mismatch between Plex for Web and the latest tested version
- Enhancement: Added loading display on stats page
- Miscellaneous: Updated the README to include a couple more links
- Miscellaneous: Removed some code that was no longer being used
- Miscellaneous: Updated supported Plex.tv Plex for Web version to (4.106.2)

## **v3.0.6**
#### 2023-04-21
- Bug: Fixed an issue where the missing episodes plugin would fail to properly process seasons/episodes
- Enhancement: Added further detail to debug logging

## **v3.0.5**
#### 2023-04-13
- Bug: Fixed an issue where the missing episodes plugin would populate episodes from the wrong season
- Enhancement: Expanded debugging verbosity for the missing episodes plugin
- Enhancement: Included the Specials season in the missing episodes plugin
- Miscellaneous: Updated the changelog page

## **v3.0.4**
#### 2023-04-07
- Bug: Fixed a display conflict with Plex for Web (4.104.2)
- Enhancement: Improved the usage of cached data
- Enhancement: Expanded the trakt plugin to show links on Season and Episode pages
- Enhancement: Expanded the TVDB plugin to show links on Season pages
- Enhancement: Expanded the debugging vebosity
- Enhancement: Added checks to prevent trying to match against unmatched items
- Enhancement: Improved the "Clear Cache" functionality

## **v3.0.3**
#### 2023-03-11
- Bug: Fixed a display conflict with Plex for Web (4.102.1)

## **v3.0.2**
#### 2023-03-07
- Bug: Fixed an compatibility issue with the latest version of Plex for Web (4.102.1)

## **v3.0.1**
#### 2023-01-13
- Bug: Fixed a display issue with the Missing Episodes toggle button
- Bug: Fixed a display issue with the plugin icons in Plex for Web 4.95.2
- Bug: Fixed a configuration issue where the wrong url for the Options page was used during initial installation

## **v3.0.0**
#### 2022-08-08
- Bug: Fixed a display issue with the Missing Episodes plugin, when the amount of episodes exceeds the max Plex will initially generate
- Enhancement: Restructured the extension to improve readability on Github
- Enhancement: Created functionality for directly searching TMDB for various IDs
- Enhancement: TVDB Plugin - Removed a lot of unused code, and improved potential match capabilities by utilising the TMDB API
- Enhancement: TMDB Plugin - Removed a lot of unused code, and improved potential match capabilities by utilising the TMDB API
- Enhancement: IMDB Plugin - Removed a lot of unused code, and improved potential match capabilities by utilising the TMDB API
- Enhancement: Trakt Plugin - Combined and optimised the code, and improved potential match capabilities by utilising the Trakt API
- Enhancement: Missing Episodes Plugin - Combined and optimised the code, and improved potential match capabilities by utilising both the TMDB and Trakt APIs
- Enhancement: Stats Plugin: Rewrote and redesigned the plugin
- Enhancement: Improved debugging content and effectiveness
- Miscellaneous: Migrated to manifest v3

## **v2.1.9**
#### 2021-11-09
- Bug: Fixed a display issue from a Plex Update. Now working with Plex Web 4.69.1

## **v2.1.8**
#### 2021-10-17
- Bug: Fixed a display issue from a Plex Update. Now working with Plex Web 4.67.1
- Bug: Fixed a display issue with the Missing Seasons
- Miscellaneous: Added Link for reporting issues in the Options
- Miscellaneous: Added Link for adding a review in the Options
- Miscellaneous: Removed references and API calls for Trakt Ratings. Plex natively supports ratings
- Miscellaneous: Brought TMDB in line with other plugins

## **v2.1.7**
#### 2021-07-23
- Enhancement: Improved the reliability of the TMDB plugin

## **v2.1.6**
#### 2021-07-23
- Bug: Fixed a display issue with the latest Plex for Web version for the various plugin links

## **v2.1.5**
#### 2021-05-23
- Bug: Fixed a display issue with the latest Plex for Web version for the Missing Episodes/Seasons plugin

## **v2.1.4**
#### 2021-05-23
- Enhancement: Reformatted "Version History" to improve readability, and better distinguish different types of changes
- Bug: Reverted back to manifest v2 to fix issue with Stats

## **v2.1.3**
#### 2021-05-17
- Bug: Set default IMDB options to "on"
- Bug: Fixed Issue with TVDB link not displaying
- Enhancement: Removed some old references
- Miscellaneous: Migrated to manifest v3

## **v2.1.2**
#### 2021-05-16
- Bug: Fixed Issue where the plugin would fail to start for Non-Plex Admins

## **v2.1.1**
#### 2021-05-15
- Bug: Fixed Issue with TMDB link not displaying

## **v2.1.0**
#### 2021-05-15
- Enhancement: Added IMDB link and logo to Movie pages
- Enhancement: Added IMDB link and logo to TV show pages

## **v2.0.1**
#### 2021-04-02
- Bug: Updated to be working with Plex for Web 4.54.5

## **v2.0.0**
#### 2021-03-02
- Bug: Updated to be working with Plex for Web 4.50.1
