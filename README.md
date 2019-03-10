# eminymous
eminymous chat. v 0.0.2

an open source project aiming to provide chatroom based chat experience without any kind of data stored anywhere except your own browser. no history. instant. completely anonymous.

https://www.eminymous.wtf/

## HOW 

- create a channel, without a password and make it public for everyone. to be displayed on the homepage.
- or enter a password to declare a private channel. and share the password with your friends to have private chat. `https://www.eminymous.wtf/private/${channelName}?password=${password}` and there you go.

this whole code is deployed to heroku within a docker container. it's running with a free redis plan.


## environment variables

### REDIS_URL or REDITOGO_URL

redis url to connect, darling. default: `redis://localhost:6379/`

### CHANNEL_EXPIRE_IN_SECONDS:

the time until when public chatroom names will be saved in redis database. yes, we save these names only for an expiring period. by using redis's `expire` function. default: `3600`

### WEBSITE_NAME:

generic name for the whole website title. default: `eminymous`


MIT License

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
