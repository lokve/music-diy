import qqBase from '@suen/music-api/dist/qq/instance/base';
import instance from '@suen/music-api/dist/util/flyio.web'

function newApi(instance) {
    return {
        async searchSongList({keyword, limit = 30, offset = 0}) {
            const params = {
                query: keyword,
                remoteplace: 'txt.yqq.playlist',
                flag_qc: 0,
                notice: 0,
                needNewCode: 0,
                page_no: offset,
                num_per_page: limit,
            }
            try {
                let data = await instance.get('/soso/fcgi-bin/client_music_search_songlist', params)
                return {
                    status: true,
                    data: data.data,
                }
            } catch (e) {
                return e
            }
        },
    }
}

function musicApi(instance) {
    const qq = newApi(qqBase(instance))

    return {
        async searchQQPlaylist(keyword, offset = 0) {
            if (!keyword) {
                return {
                    status: false,
                    msg: '查询参数不能为空'
                }
            }
            return await qq['searchSongList']({keyword, offset, limit: 20})
        },
    }
}

export default function (adapter) {
    return musicApi(instance(adapter))
}