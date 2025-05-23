# Enhanced Plex Changelog

## **v3.3.4**

### 2025-04-27

- Enhancement: Add new option to control whether the Changelog is opened when the extension is updated
- Enhancement: Add new option to control whether the Warning/Error icon appears when the Plex version doesn't match the latest tested version
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.145.1
- Miscellaneous: Updated supported Local Plex for Web version to 4.145.1

## **v3.3.3**

### 2024-07-12

- Bug: Fixed an issue where "named" seasons would not be recognised
- Bug: Fixed a display alignment issue with Missing Episodes
- Bug: Fixed an issue with the display of the Plex Token during debug
- Miscellaneous: Removed unneccessary debug code
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.133.0
- Miscellaneous: Updated supported Local Plex for Web version to 4.132.2

## **v3.3.2**

### 2024-07-01

- Bug: Fixed an issue with the console displaying certain information that should be excluded while debug options are turned off
- Bug: Fixed an issue where the extension would not handle connection timeouts when checking for servers
- Enhancement: Changed the preference to use the local uri, where possible, to enable faster requests

## **v3.3.1**

### 2024-06-14

- Bug: Fixed an issue with settings not retaining, and returning to default values after a period of time
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.131.1
- Miscellaneous: Updated supported Local Plex for Web version to 4.125.1

## **v3.3.0**

### 2024-03-05

- Bug: Fixed an issue getting the TMDB ID when it isn't in the metadata
- Bug: Fixed an issue where the Audience Rating was being marked as "0-1" incorrectly, when not present
- Bug: Fixed an issue where the "Refresh Data" option would not work in certain circumstances
- Bug: Fixed an issue where multiple Genres would inadvertantly increase total counts for various graphs
- Bug: Fixed an issue where a refresh before charts were drawn fully, would cause a crash
- Bug: Fixed an issue where the main page wouldn't be detected for local Plex installs, without the trailing slash
- Enhancement: Now opens the changelog when the extension is updated
- Enhancement: Added new table on the Stats page, for TV/Movies without certain values
- Enhancement: Added new graphs for "Total Added over time"
  - Stats cache should automatically be cleared. Any issues, try the "Refresh Data" button, first
- Enhancement: Migrated TMDB API to utilize cached data
- Enhancement: Migrated Trakt API to fully utilize cached data
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.125.1
- Miscellaneous: Updated supported Local Plex for Web version to 4.123.2
- Miscellaneous: Added Google Analytics (No identifiable information, and excluded from Ads. See below table)
  - Excerpt from Google's Documentation:
  - _"If you exclude an event or user-scoped custom dimension from ads personalization, then any audience that is based on that data is not eligible for export from Analytics to any of Google's advertising products (e.g., Google Ads, Display & Video 360, Search Ads 360)"_

| **Metric**        | **Description**                                                                          | **Purpose**                                                                                                                   |
|-------------------|------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Client_ID         | This is randomly generated                                                               | This is used to generate total unique user counts                                                                             |
| Session_ID        | This is randomly generated                                                               | This is used to distinguish between refreshing a page, and pages visits that occur multiple hours apart                       |
| Screen_Resolution | The current display resolution (e.g. 1920x1080)                                          | This is used to enable us to accurately test the display of the various pages, based on the most popular resolutions          |
| Extension_Version | The version that you are currently using (e.g. v3.0.0)                                   | This is used to help troubleshoot any potential issues                                                                        |
| API_Usage         | Whether the Plugin APIs are using cached data or connecting to a live service            | This is used to determined how many live API calls are currently being sent, vs how many have been avoided by using the cache |
| Page_Views        | Extension page views (Options, Stats, Changelog), does not log any pages related to Plex | This is used to help us determine where to focus our efforts, when considering features to add.                               |

## **v3.2.1**

### 2024-02-01

- Bug: Fixed an issue with the displayed episode count when "Specials" is present
- Bug: Fixed an issue where the Poster Slider size wouldn't work for "missing" episodes (Max. 32 episodes (21 on the "largest" zoom))
- Bug: Fixed an issue where the Poster Slider size wouldn't work for "missing" seasons
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.123.1

## **v3.2.0**

### 2024-01-20

- Enhancement: Added Total episode count for each season
- Enhancement: Added Sonarr Link
- Enhancement: Added Radarr Link
- Enhancement: Changed the way text is displayed on the Options page, for better readability
- Enhancement: Changed the format of the debug text when retrieving / Storing cache items
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.122.0

## **v3.1.5**

### 2024-01-02

- Bug: Fixed Missing Episodes not being displayed on Plex for Web version is 4.121.1
- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.121.1
- Miscellaneous: Updated supported Local Plex for Web version to 4.118.0
- Miscellaneous: Added link to Discord

## **v3.1.4**

### 2023-10-06

- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.116.1

## **v3.1.3**

### 2023-08-25

- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.113.2
- Miscellaneous: Corrected a typo in the minimum required warning message
- Miscellaneous: Fixed the formatting of the links in the README file

## **v3.1.2**

### 2023-07-14

- Miscellaneous: Updated supported Plex.tv Plex for Web version to 4.110.1
- Miscellaneous: Updated supported Local Plex for Web version to 4.108.0

## **v3.1.1**

### 2023-06-09

- Bug: Fixed an issue where clicking on the compatibility warning/error would inadvertantly send you back to the homepage
- Bug: Fixed an issue where the compatability warning would stop the extension when displayed

## **v3.1.0**

### 2023-05-26

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

### 2023-04-21

- Bug: Fixed an issue where the missing episodes plugin would fail to properly process seasons/episodes
- Enhancement: Added further detail to debug logging

## **v3.0.5**

### 2023-04-13

- Bug: Fixed an issue where the missing episodes plugin would populate episodes from the wrong season
- Enhancement: Expanded debugging verbosity for the missing episodes plugin
- Enhancement: Included the Specials season in the missing episodes plugin
- Miscellaneous: Updated the changelog page

## **v3.0.4**

### 2023-04-07

- Bug: Fixed a display conflict with Plex for Web (4.104.2)
- Enhancement: Improved the usage of cached data
- Enhancement: Expanded the trakt plugin to show links on Season and Episode pages
- Enhancement: Expanded the TVDB plugin to show links on Season pages
- Enhancement: Expanded the debugging vebosity
- Enhancement: Added checks to prevent trying to match against unmatched items
- Enhancement: Improved the "Clear Cache" functionality

## **v3.0.3**

### 2023-03-11

- Bug: Fixed a display conflict with Plex for Web (4.102.1)

## **v3.0.2**

### 2023-03-07

- Bug: Fixed an compatibility issue with the latest version of Plex for Web (4.102.1)

## **v3.0.1**

### 2023-01-13

- Bug: Fixed a display issue with the Missing Episodes toggle button
- Bug: Fixed a display issue with the plugin icons in Plex for Web 4.95.2
- Bug: Fixed a configuration issue where the wrong url for the Options page was used during initial installation

## **v3.0.0**

### 2022-08-08

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

### 2021-11-09

- Bug: Fixed a display issue from a Plex Update. Now working with Plex Web 4.69.1

## **v2.1.8**

### 2021-10-17

- Bug: Fixed a display issue from a Plex Update. Now working with Plex Web 4.67.1
- Bug: Fixed a display issue with the Missing Seasons
- Miscellaneous: Added Link for reporting issues in the Options
- Miscellaneous: Added Link for adding a review in the Options
- Miscellaneous: Removed references and API calls for Trakt Ratings. Plex natively supports ratings
- Miscellaneous: Brought TMDB in line with other plugins

## **v2.1.7**

### 2021-07-23

- Enhancement: Improved the reliability of the TMDB plugin

## **v2.1.6**

### 2021-07-23-

- Bug: Fixed a display issue with the latest Plex for Web version for the various plugin links

## **v2.1.5**

### 2021-05-23

- Bug: Fixed a display issue with the latest Plex for Web version for the Missing Episodes/Seasons plugin

## **v2.1.4**

### 2021-05-23-

- Enhancement: Reformatted "Version History" to improve readability, and better distinguish different types of changes
- Bug: Reverted back to manifest v2 to fix issue with Stats

## **v2.1.3**

### 2021-05-17

- Bug: Set default IMDB options to "on"
- Bug: Fixed Issue with TVDB link not displaying
- Enhancement: Removed some old references
- Miscellaneous: Migrated to manifest v3

## **v2.1.2**

### 2021-05-16

- Bug: Fixed Issue where the plugin would fail to start for Non-Plex Admins

## **v2.1.1**

### 2021-05-15

- Bug: Fixed Issue with TMDB link not displaying

## **v2.1.0**

### 2021-05-15-

- Enhancement: Added IMDB link and logo to Movie pages
- Enhancement: Added IMDB link and logo to TV show pages

## **v2.0.1**

### 2021-04-02

- Bug: Updated to be working with Plex for Web 4.54.5

## **v2.0.0**

### 2021-03-02

- Bug: Updated to be working with Plex for Web 4.50.1
