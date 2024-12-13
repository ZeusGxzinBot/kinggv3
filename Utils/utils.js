import moment from "moment"
import "moment-precise-range-plugin"
import "util-stunks"

class Util {
    constructor(client) {
        this.client = client
    }

    formatTime(timestamp, pre = 2) {
        let object = moment.preciseDiff(Date.now(), timestamp, true), arr = []

        if (object.years >= 1) arr.push(`${object.years} ${object.years === 1 ? 'ano' : 'anos'}`)
        if (object.months >= 1) arr.push(`${object.months} ${object.months === 1 ? 'mês' : 'meses'}`)
        if (object.days >= 1) arr.push(`${object.days} ${object.days === 1 ? 'dia' : 'dias'}`)
        if (object.hours >= 1) arr.push(`${object.hours} ${object.hours === 1 ? 'hora' : 'horas'}`)
        if (object.minutes >= 1) arr.push(`${object.minutes} ${object.minutes === 1 ? 'minuto' : 'minutos'}`)
        if (object.seconds >= 1) arr.push(`${object.seconds} ${object.seconds === 1 ? 'segundo' : 'segundos'}`)

        if (arr.length < pre && arr.length >= 2) pre = arr.length

        if (arr.length == 0) return 'alguns milissegundos'
        if (arr.length == 1) return arr.join(' ')
        else return arr.slice(0, pre - 1).join(', ') + ' e ' + arr[pre - 1]
    }

    validateDate(date) {
        let test = /^\d{1,2}\/\d{1,2}$/.test(date)
        if (!test) return false

        let [day, month] = date.split('/').map(Number)
        let last_day = new Date(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) - 1).getDate()
        let valid_month = month >= 1 && month <= 12
        let valid_day = day >= 1 && day <= last_day

        return valid_month && valid_day
    }

    async findUser(id, client, message, author = true) {
        let user =
            message.mentions.users.first() ||
            client.users.cache.get(id) ||
            message.guild.members.cache.find(x => x.username?.toLowerCase()?.includes(message.content?.toLowerCase()))

        if (!user) {
            try {
                user = await client.users.fetch(id)
            } catch (e) { null }
        }

        if (!user) {
            if (author) return message.author
            else return false
        } else return user
    }

    calcPercentage(va, vl, pre = 2) {
        if (!va || !vl) return '0%'
        if (!pre || pre < 2 || isNaN(pre)) pre = 2
        return ((va / vl) * 100).toFixed(pre) + "%"
    }

    genString(size) {
        let result = '',
            char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < size; i++) {
            result += char.charAt(Math.floor(Math.random() * char.length));
        }

        return result;
    }

    genNumber(min, max) {
        let amount = Math.floor(Math.random() * (max - min)) + min
        return amount;
    }

    formatNumber(arg, max_author = 0, max_opponent = 0, max_total = 0) {
        let res = 0
        max_author = Number(max_author), max_opponent = Number(max_opponent), max_total = Number(max_total)

        if (!isNaN(arg)) res = arg
        else {
            if (['max', 'all', 'tudo'].includes(arg?.toLowerCase())) res = Number(max_author > max_opponent && max_opponent > 0 ? max_opponent : max_author)
            else if (['half', 'metade'].includes(arg?.toLowerCase())) res = Number((max_author > max_opponent && max_opponent > 0 ? max_opponent : max_author)) / 2
            else if (['sobras'].includes(arg?.toLowerCase())) {
                let money = parseInt(max_author).toLocaleString().replace(',', '.')
                res = money.slice(money.split('.').length - 1).replace(/\./g, '');
            } else {
                let multi = arg?.substr(-2).toLowerCase()
                if (multi == 'kk') res = parseFloat(arg) * 1_000_000
                else multi = arg?.substr(-1).toLowerCase()
                if (multi == 'b') res = parseFloat(arg) * 1_000_000_000
                if (multi == 'm') res = parseFloat(arg) * 1_000_000
                if (multi == 'k') res = parseFloat(arg) * 1_000
            };
        }

        if (max_total > 0 && res > max_total) res = max_total

        if (isNaN(res)) return 0
        else return parseInt(res)
    }

    convertArgsToTime(args) {
        let SECONDS_PATTERN = "([0-9]+) ?(s|seg|segs)",
            MINUTES_PATTERN = "([0-9]+) ?(min|m|mins|minutos|minutes)",
            YEAR_PATTERN = "([0-9]+) ?(y|a|anos|years)",
            MONTH_PATTERN = "([0-9]+) ?(month(s)?|m(e|ê)s(es)?)",
            WEEK_PATTERN = "([0-9]+) ?(w|semana|semanas|weaks)",
            DAY_PATTERN = "([0-9]+) ?(d|dias|days)",
            HOUR_PATTERN = "([0-9]+) ?(h|hour|hora|horas|hours)",
            DATE_FORMAT = /(((0|1)[0-9]|2[0-9]|3[0-1])\/(0[1-9]|1[0-2])\/((19|20)\d\d))$/,
            HOUR_FORMAT = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/

        let timeInMs = 0;

        if (DATE_FORMAT.test(args[0])) {
            let t = HOUR_FORMAT.test(args[1]) ? moment(args.toString().toLowerCase().replace(/,/g, ' '), 'DDMMYYYY HH:mm') : moment(args.toString().toLowerCase().replace(/,/g, ' '), 'DDMMYYYY')
            t = Date.parse(t) - ms('5h')
            return t - Date.now() > 0 ? t - Date.now() : 1
        }

        if (HOUR_FORMAT.test(args[0])) {
            args = args.toString().toLowerCase().replace(/,/g, ' ')
            let t = moment(args, 'HH:mm')
            t = Date.parse(t) - ms('5h')
            return t - Date.now() > 0 ? t - Date.now() : 1
        }

        args = args.toString().toLowerCase().replace(/,/g, ' ')

        let yearValue = args.match(YEAR_PATTERN);
        if (yearValue) timeInMs += moment().add(`${yearValue[1]} `, 'years') - Date.now()

        let monthValue = args.match(MONTH_PATTERN);
        if (monthValue) timeInMs += moment().add(`${monthValue[1]} `, 'months') - Date.now()

        let weekValue = args.match(WEEK_PATTERN);
        if (weekValue) timeInMs += moment().add(`${weekValue[1]} `, 'weeks') - Date.now()

        let dayValue = args.match(DAY_PATTERN)
        if (dayValue) timeInMs += moment().add(`${dayValue[1]} `, 'days') - Date.now()

        let hourValue = args.match(HOUR_PATTERN);
        if (hourValue) timeInMs += moment().add(`${hourValue[1]} `, 'hours') - Date.now()

        let minutesValue = args.match(MINUTES_PATTERN);
        if (minutesValue) timeInMs += 60000 * minutesValue[1]

        let secondsValue = args.match(SECONDS_PATTERN);
        if (secondsValue) timeInMs += 1000 * secondsValue[1]

        return timeInMs
    }

    stringProgressBar(current, total, size, char1, char2) {
        let progress = Math.round((size * current) / total),
            result = `${char1}`.repeat(progress) + `${char2}`.repeat(size - progress)

        return result
    }
}

export default Util