const cache = require('../cache');
const insure = require('./insure');
const select = require('./select');
const crypto = require('../crypto');
const request = require('../request');

const format = (song) => {
    const SingerName = song.SingerName.split('、');
    return {
        id: song.FileHash,
        name: song.SongName,
        duration: song.Duration * 1000,
        album: {id: song.AlbumID, name: song.AlbumName},
        artists: song.SingerId.map((id, index) => ({id, name: SingerName[index]})),
    };
};

const search = (info) => {
    const url =
        'http://songsearch.kugou.com/song_search_v2?' +
        'keyword=' +
        encodeURIComponent(info.keyword) +
        '&page=1';

    return request('GET', url)
        .then((response) => response.json())
        .then((jsonBody) => {
            const list = jsonBody.data.lists.map(format);
            const matched = select(list, info);
            return matched ? matched.id : Promise.reject();
        })
        .catch(() => insure().kugou.search(info));
};

const track = (id) => {
    // const url =
    // 	'http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=' + id

    // return request('GET', url)
    // .then(response => response.json())
    // .then(jsonBody => jsonBody.url || Promise.reject())

    const url =
        'http://trackercdn.kugou.com/i/v2/?' +
        'key=' +
        crypto.md5.digest(`${id}kgcloudv2`) +
        '&hash=' +
        id +
        '&' +
        'br=hq&appid=1005&pid=2&cmd=25&behavior=play';

    return request('GET', url)
        .then((response) => response.json())
        .then((jsonBody) => jsonBody.url[0] || Promise.reject());
};

const check = (info) => cache(search, info).then(track);

const searchList = (info) => {
    const url =
        'http://songsearch.kugou.com/song_search_v2?' +
        'keyword=' +
        encodeURIComponent(info.keyword) +
        '&page=1';

    return request('GET', url)
        .then((response) => response.json())
        .then((jsonBody) => {
            const list = jsonBody.data.lists;
            console.log(list);
            return list.map((item) => {
                const SingerName = song.SingerName.split('、');
                return {
                    id: 'kugou' + item.FileHash,
                    songId: item.FileHash,
                    name: item.SongName,
                    artists: item.SingerId.map((id, index) => ({id, name: SingerName[index]})),
                    album: {id: item.AlbumID, name: item.AlbumName},
                    vendor: 'qq',
                    newVendor: 'kugou',
                    param: item.FileHash,
                    duration: item.Duration * 1000,
                };
            });
        })
        .catch(() => insure().kugou.search(info));
};

const getSong = async (param) => {
    const url = await track(param);
    return {
        url,
    };
};

module.exports = {check, search, searchList, getSong};
