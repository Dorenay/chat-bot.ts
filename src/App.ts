
import messages = require('./message');
import $ = require("jquery");
import { from } from 'rxjs/observable/from';

let User = {
    name: '',
    surname: '',
    date: '',
    rooms: '',
    tel: ''
};
//сценарий развития диалога
let scenario = {
    //изначальные параметры - false значит что данное соощение ещё не выводилось
    name: false,
    date: false,
    rooms: false,
    tel: false,

    //запуск шага step: id шага - значение должно соответсвовать полям из обьекта юзер, error - ошибка валидации воода предыдущего сообщения, args - массив инпутов, которые потребуются на данном шаге
    step: function(step: string, error: boolean, ...args){
        let msg: string; // переменная, которая будет хранить стринг первого сообщения бота
        if(!error){//проверка на ошибку валидации
            msg = this[step] ? messages[step].edit : messages[step].start; // проверка что сообщние выводиться не впервые
        }else{
            msg = messages.error; //получение стоки об ошибке
        }
        bot.createRequest(msg, step); //вывод первой строки блока сообщений бота
        bot.createForm(...args); //вывод формы для заполнения данных юзером
    },
    //подготовка шага. answer - id поля с ответом на последнее сообщение 
    nextStep: function(answer: string = undefined){
        if(answer != undefined){
            bot.createRequest(messages[answer].end, answer); //вывод ответа
        }
        //подготовка следующего сообщения
        if(User.name == ''){
            this.step('name', false, 'name');
        }else if(User.date == ''){
            this.step('date', false, 'date');
        }else if(User.rooms == ''){
            this.step('rooms', false, 'rooms');
        }else if(User.tel == ''){
            this.step('tel', false, 'tel');
        }else{
            this.finish();
        }
    },
    //функция вывода последнего сообщения
    finish: function(){
        console.log('FINISH');
    },
};
//обьект ДОМ элементов
let inputs = {
    tel: `<input type='tel' name='tel' value='%tel%'>`,
    rooms: `<input type='number' name='rooms' value='%rooms%'>`,
    date: `<input type='date'  name='date' value='%date%'>`,
    name: `<input type='text' name='name' value='%name%' placeholder='Имя'>`,
    surname: `<input type='text' name='surname' value='%value%' placeholder='Фамилия'>`,
    edit: `<button class="btn btn-primary"  data-js="edit"><i class="far fa-edit"></i></button>`,
    submit: `<button type="submit" class="btn btn-primary"><i class="far fa-share-square"></i></button>`   
};

// создание сообщений в чате
let bot = {
    //создание первого сообщения из шага в чате
    createRequest: function(msg: string, target: string){//msg - сообщение из класса messages //target - значение из обьекта юзер
        $('#chat').append(`
            <div class="chat__msg chat__msg--bot d-flex mr-auto w-50">
        
                ${string_prepare(msg, target)} 
            </div>
        `);
    },
    //создание диалогового окна ответа юзера
    createForm: function(...rows: string[]){ //rows - группа требуемых значний в форме
        //обьект выводимого сообщения
        let msg = {
            //отрытие тега формы
            start: `
                <div class="chat__msg chat__msg--user d-flex ml-auto w-50">
                    <form data-id="${rows[0]}" method='POST'>
            `,
            //закрытие тега формы и выврд кнопки отправить
            end: `
                    ${inputs.submit}
                    </form>
                </div>
            `,
            //вывод инпутов
            body: function(){
                let res: string = '';
                for (let row of rows) {
                    res += string_prepare(inputs[row], row);
                }
                return res;
            },
            //метод получения всей формы
            get: function(){
                return this.start + this.body() + this.end;
            }                 
        }
        //рендер формы
        $('#chat').append(`
            ${msg.get()}
        `);
    },
    renderError:function(form: any, msg: string){
        form.append(`
            <p class="error">
                ${msg}
            </p>
        `);
    }
};

//сабмит формы юзером
$(document).on('submit', 'form', function(event){
    //убираем перезагрузку страницы
    event.preventDefault();
    //получаем инпут формы
    let input = $(this).find('input');

    //получаем значение name input-а
    let field = input.attr('name'); 

    //получаем значение value этого инпута
    let value = $(this).find(`input[name="${field}"]`).val();
    //проверим или value != 0
    if(value != ''){  
        //блочим инпут
        input.prop('disabled', true);
        //удаляем кнопку отправки
        $(this).find('button').remove();
        //добавляем кнопку редактировать
        $(this).parent().append(inputs.edit);
        //получаем значение data-id form
        let id = $(this).data('id');

        //присваемваем значение этого инпута соответсвующейму свойству User
        User[field] = value;
        //делаем в ценарии пометку что шаг пройден
        scenario[id] = true;
        //запускаем следуюющий шаг
        scenario.nextStep(field);   
    }else{
        //выводим ошибку
        bot.renderError($(this), messages.error);
        //подсвечиваем инпут
        input.addClass('error');
        //фокусим инпут
        input.focus();
        // scenario.step(field, true, field);
    }
});

//редактирование данных юзером
$(document).on('click', 'button[data-js="edit"]', function(){
    //удаляем текушее поле ввода
    $('#chat').find('.chat__msg--user:last-of-type').remove();
    //получаем гнужную форму
    let form = $(this).prev();
    //чтобы знать какой шаг редактируем получаем форм[дата-ид]
    let form_id = form.data('id');
    //запускаем шаг для перезаписи сценария
    scenario.step(form_id, false, form_id);
});

//удаляем сообщение об ошибке, если оно есть
$(document).on('change paste keyup', 'input', function(){
    //удаляем сообщение
    $(this).parents('form').find('p.error').remove();
    //удаляем подсветку инпута
    $(this).removeClass('error');
});
//готовим inputs

function string_prepare(str: string , target: string){
    //проводим замену атритута name
    return str.replace(`%${target}%`, User[target]);
}
function messages_prepare(msg){

    function set_values(text: string){
        let dependencies = {
            name: User.name,
            tel: User.tel,
            data: User.date,
            rooms: User.rooms,
            days: 7
        }
        for(let depandence in dependencies){
            console.log('depandence', depandence, 'dependencies[depandence]', dependencies[depandence]);
            text = text.replace(`%${depandence}%`, dependencies[depandence]);
        }
        return text;
    }
    function reload(obj = {}){
        let res = {};
        for(let item in obj){
            if(typeof obj[item] != 'object'){
                res[item] = set_values(obj[item]);
            }else{
                res[item] = reload(obj[item]);
            }
        }   
        return res;
    }
    console.log(reload(messages.name));
}


$(function(){
    scenario.nextStep();
    messages_prepare(123);
});

