
//dataStr.replace(/(\([^\)]+),([^\(]+\))/g, "$1;$2");
var dataArr = [];
$.get('delaney/data.csv', function (d) {
	//processData(d);
	dataArr = CSV.parse(d);
	console.log(dataArr);
	processData(JSON.parse(JSON.stringify(dataArr)));
	createPage();
})

var data = {};
var header;

var timePoints = [
		"0 Minutes","5 Minutes","10 Minutes","15 Minutes","20 Minutes", "30 Minutes", "40 Minutes", "50 Minutes", "60 Minutes", "75 Minutes", "90 Minutes", "105 Minutes", "120 Minutes"
	];


var condenseDataArr = function () {
	var res = "";

	var header = dataArr[0];
	var line = dataArr[0];

	//header
	res += line[0] + "\t" + line[1] + "\t" + line[2] + "\t" + line[3] + "\t" + line[4] + "\t" + line[5] + "\t" + line[6];
	res += "\t7. Chronic Pain\t8.Chronic Opiod Therapy\t" + line[49] + "\t10. Drug Given";
	for (j = 54; j < line.length; j += 1) {
		res += "\t" + line[j];
	}

	for (var i = 1; i < dataArr.length; i += 1) {
		line = dataArr[i];
		res += "\n" + line[0] + "\t" + line[1] + "\t" + line[2] + "\t" + line[3] + "\t" + line[4] + "\t" + line[5] + "\t" + line[6];

		//Chronic Pain
		if (line[7].match(/No/i)) {
			res += "\tNo";
		} else {
			res += "\tYes";
			for (var j = 8; j < 27; j += 1) {
				if (line[j].match(/^checked/i)) {
					res += ", " + header[j].match(/choice=([\S\s]+)\)/i)[1];
				}
			}
			if (line[28] !== "") {
				res += ", " + line[28];
			}
		}

		//Opiod Therapy
		if (line[29].match(/No/i)) {
			res += "\tNo";
		} else {
			res += "\tYes";
			for (j = 30; j < 47; j += 1) {
				if (line[j].match(/^checked/i)) {
					res += ", " + header[j].match(/choice=([\S\s]+)\)/i)[1];
				}
			}
			if (line[48] !== "") {
				res += ", " + line[48];
			}
			// } else {
			// 	res = res.match(new RegExp("^[\\S\\s]{" + (res.length - 2) + '}','i'))[0];
			// }
		}

		//q9
		 res+= '\t' + line[49];

		//Drug given
		var len;
		res += '\t';
		len = res.length;
		for (j = 50; j < 54; j += 1) {
			if (line[j].match(/^checked/i)) {
				res += header[j].match(/choice=([^\(\)]+)/i)[1] + ", ";
			}
		}
		if (len < res.length) {
				res = res.match(new RegExp("^[\\S\\s]{" + (res.length - 2) + '}','i'))[0];
			}

		//Extra Drugs given?
		for (j = 54; j < 83; j += 1) {
			res += '\t' + line[j];
		}

		for (j = 83; j < 116; j += 1) {
			var num = line[j];
			if (num && typeof num === 'string') {
				num = num.match(/\d{1,2}/);	
				num = num.length ? num[0] : 0;
			}
			res += '\t' + num;
		}

		for (j = 116; j < 125; j += 1) {
			res += '\t' + line[j];
		}

	}




	return res;
}

var processData = function (dataArr) {
	header = dataArr.shift();
	var headerStore = {};
	//var data = {};

	//If the header has multiple of the same entries
	for (hi = 0; hi < header.length; hi += 1) {
		if (headerStore.hasOwnProperty(header[hi])) {
			headerStore[header[hi]]+=1;
			header[hi] +="_" + headerStore[header[hi]]; 
		} else {
			headerStore[header[hi]] = 1;
		}
	}

	for(var ind = 0; ind < dataArr.length; ind += 1 ){
		var lineArr = dataArr[ind];
		while(data.hasOwnProperty(lineArr[0])) {
			console.error("repeat: " + lineArr[0] + ". Was saved as repeat in ID#");
			lineArr[0] += "_newVisit";
		}
		data[lineArr[0]] = {};
		for(var h = 1; h < lineArr.length; h+= 1){
			data[lineArr[0]][header[h]] = lineArr[h];
		}
	}

	return data;



	var demsCat = ["7. Does the patient have a history of chronic pain?", "2.  Age:", "3.  Gender:", "4.  Race:"];

	var dems = {};
	for(group in groups) {
		dems[group] = {points: {}, count: {}};
		var res = dems[group];
		for(var i = 0; i < demsCat.length; i += 1) {
			for(pt in groups[group]) {
	            tp = demsCat[i];
				if (!res.count.hasOwnProperty(tp)) {
					res.count[tp] = 0;
					res.points[tp] = [];
				}
				var num = groups[group][pt][tp];
				if (num) {
					res.count[tp] += 1;
					res.points[tp].push(num);
				}
			}
			if(i === 0) {
				
			}	
		}
	}
}


var calcChangeFromStart = function (groups) {
	var avgs = {};
	for(group in groups) {
		avgs[group] = {points: {}, ster: {}, std: {}, avg: {}, total: {}, count: {}};
		res = avgs[group];
		for(var i = 0; i < timePoints.length; i += 1) {
			for(pt in groups[group]) {
	            tp1 = timePoints[i];
	            tp0 = timePoints[0];
	            tp = tp1;
				if (!res.total.hasOwnProperty(tp)) {
					res.total[tp] = 0;
					res.count[tp] = 0;
					res.points[tp] = [];
				}
				var num = undefined, num1 = undefined, num0 = undefined;
				num1 = groups[group][pt][tp1];
				if (typeof num1 === 'string') {
					num1 = num1.match(/\d{1,2}/);
				}
				num0 = groups[group][pt][tp0];
				if (typeof num0 === 'string') {
					num0 = num0.match(/\d{1,2}/);
				}
				num = num1 * 1 - num0 * 1;
				if (num !== undefined) {
					num *= 1
					res.total[tp] += num; 
					res.count[tp] += 1;
					res.points[tp].push(num);
				}
			}
			res.avg[tp] = res.total[tp]/res.count[tp];
			res.std[tp] = 0;

			for(var j = 0; j < res.points[tp].length; j +=1) {
				res.std[tp] += Math.pow(res.avg[tp]-res.points[tp][j],2)/(res.count[tp]-1);
			}
			res.std[tp] = Math.sqrt(res.std[tp]);
			res.ster[tp] = res.std[tp] / Math.sqrt(res.count[tp]);

		}
	}
	return avgs;
}

var calcSideScore = function (groups) {
	var side1 = [
		"Changes in Hearing",	"Changes in Vision",	"Dizziness",	"Fatigue",	"Feeling of Unreality",	"Generalized Discomfort",	"Hallucination",	"Headache",	"Mood Change",	"Nausea"
	];
	var side2 = [
		"Changes in Hearing_2",	"Changes in Vision_2",	"Dizziness_2",	"Fatigue_2",	"Feeling of Unreality_2",	"Generalized Discomfort_2",	"Hallucination_2",	"Headache_2",	"Mood Change_2",	"Nausea_2"
	];
	var avgs = {};

	for(group in groups) {
		avgs[group] = {points: {'side1':[],'side2':[]}, std: {side1:0, side2:0}, avg: {side1:0, side2:0}, total: {side1:0, side2:0}, count: {side1:0, side2:0}};
		res = avgs[group];
		var good1 = false;
		var good2 = false;
		for(pt in groups[group]) {
			var sc1 = 0, sc2 = 0;
			for (var i = 0; i < side1.length; i += 1) {
				num = groups[group][pt][side1[i]];
				if (typeof num === 'string') {
					num = num.match(/\d{1,2}/);
				}
				if (num !== undefined) {
					sc1+= num*1;
					good1 = true;
				}
				num = groups[group][pt][side2[i]];
				if (typeof num === 'string') {
					num = num.match(/\d{1,2}/);
				}
				if (num !== undefined) {
					sc2+= num*1;
					good2 = true;
				}
			}

			if (!good1 || !good2) {
				continue;
			}
			res.total.side1 += sc1; 
			res.count.side1 += 1;
			res.points.side1.push(sc1);
			res.total.side2 += sc2; 
			res.count.side2 += 1;
			res.points.side2.push(sc2);
		}
		res.avg.side1 = res.total.side1/res.count.side1;
		res.avg.side2 = res.total.side2/res.count.side2;
		res.std.side1 = 0;
		res.std.side2 = 0;
		for(var j = 0; j < res.points.side1.length; j +=1) {
			res.std.side1 += Math.pow(res.avg.side1-res.points.side1[j],2)/(res.count.side1-1);
			res.std.side2 += Math.pow(res.avg.side2-res.points.side2[j],2)/(res.count.side2-1);
		}
		res.std.side1 = Math.sqrt(res.std.side1);
		res.std.side2 = Math.sqrt(res.std.side2);
	}
	return avgs;
}


var drugGroups = function (data) {
	groups = {ketamine: {}, dilaudid: {}, morphine: {}};
	for(pt in data) {
		var count = 0;
		if (data[pt]['10. Was the patient given any of the following medication/s? (choice=Hydromorphine (Dilaudid) 1mg or 0.015mg/kg (Answer 10.b.))'] === 'Checked') {
			groups.dilaudid[pt] = data[pt];
			count+=1;
		}
		if(data[pt]['10. Was the patient given any of the following medication/s? (choice=Ketamine 0.15mg/kg  (Answer 10.a.))'] === 'Checked'){
			groups.ketamine[pt] = data[pt];
			count+= 1;
		}
		if(data[pt]['10. Was the patient given any of the following medication/s? (choice=Morphine 0.1mg/kg  (Answer10.c.))'] === 'Checked') {
			groups.morphine[pt] = data[pt];
			count+= 1;
		}
		if(count > 1) {
			console.error(pt + ' is in multiple groups');
			delete groups.dilaudid[pt];
			delete groups.ketamine[pt];
			delete groups.morphine[pt];
		}
	}
	return groups;
} 

var calcAvgs = function (groups) {
	var avgs = {}, num;
	for(group in groups) {
		avgs[group] = {points: {}, std: {}, avg: {}, total: {}, count: {}};
		res = avgs[group];
		for(var i = 0; i < timePoints.length; i += 1) {
			for(pt in groups[group]) {
	            tp1 = timePoints[i];
	            tp = tp1;
				if (!res.total.hasOwnProperty(tp)) {
					res.total[tp] = 0;
					res.count[tp] = 0;
					res.points[tp] = [];
				}
				num = groups[group][pt][tp];
				if (typeof num === 'string') {
					num = num.match(/\d{1,2}/);
				}
				if (num !== undefined) {
					num *= 1
					res.total[tp] += num; 
					res.count[tp] += 1;
					res.points[tp].push(num);
				}
			}
			res.avg[tp] = res.total[tp]/res.count[tp];
			res.std[tp] = 0;
			for(var j = 0; j < res.points[tp].length; j +=1) {
				res.std[tp] += Math.pow(res.avg[tp]-res.points[tp][j],2)/(res.count[tp]-1);
			}
			res.std[tp] = Math.sqrt(res.std[tp])/Math.sqrt(res.count[tp]);
		}
		
	}
	return avgs;
}

var printavgs = function (avgs) {
	var strArr =  [[]];
	var gCount = 0;
	for (var group in avgs) {
		strArr[0][gCount] = group;
		for (var i = 0; i < timePoints.length; i += 1) {
			if (strArr[i+1]) {
				strArr[i+1][gCount] = avgs[group].avg[timePoints[i]];	
			} else {
				strArr[i+1] = [];
				strArr[i+1][gCount] = avgs[group].avg[timePoints[i]];
			}
			
		}
		gCount+=1;
	}
	var str = "";
	for (i = 0; i < strArr.length; i += 1) {
		str += strArr[i].join("\t");
		str += "\n";
	}
	console.log(str);
	return str;
}


var groupsOpiods = function (data) {
	var groups = {ketamineOp: {}, dilaudidOp: {}, morphineOp: {}, ketamineNo: {}, dilaudidNo: {}, morphineNo: {}};
	var dil = '10. Was the patient given any of the following medication/s? (choice=Hydromorphine (Dilaudid) 1mg or 0.015mg/kg (Answer 10.b.))';
	var morp = '10. Was the patient given any of the following medication/s? (choice=Morphine 0.1mg/kg  (Answer10.c.))';
	var ket = '10. Was the patient given any of the following medication/s? (choice=Ketamine 0.15mg/kg  (Answer 10.a.))';
	var ther = '8.  Is the patient on chronic opioid therapy?'

	for(pt in data) {
		var count = 0;
		if (data[pt][dil] === 'Checked') {
			if(data[pt][ther].match(/yes/i)) {
				groups.dilaudidOp[pt] = data[pt];
				count+= 1;
			} else if (data[pt][ther].match(/no/i)) {
				groups.dilaudidNo[pt] = data[pt];
				count+= 1;
			}
		}
		if(data[pt][ket] === 'Checked'){
			if(data[pt][ther].match(/yes/i)) {
				groups.ketamineOp[pt] = data[pt];
				count+= 1;
			} else if (data[pt][ther].match(/no/i)) {
				groups.ketamineNo[pt] = data[pt];
				count+= 1;
			}
		}
		if(data[pt][morp] === 'Checked') {
			if(data[pt][ther].match(/yes/i)) {
				groups.morphineOp[pt] = data[pt];
				count+= 1;
			} else if (data[pt][ther].match(/no/i)) {
				groups.morphineNo[pt] = data[pt];
				count+= 1;
			}
		}
		if(count > 1) {
			console.error(pt + ' is in multiple groups')
		}
	}
	return groups;
}

var groupsGender = function (data) {
	var groups = {ketamineMen: {}, dilaudidMen: {}, morphineMen: {}, ketamineWo: {}, dilaudidWo: {}, morphineWo: {}};
	var dil = '10. Was the patient given any of the following medication/s? (choice=Hydromorphine (Dilaudid) 1mg or 0.015mg/kg (Answer 10.b.))';
	var morp = '10. Was the patient given any of the following medication/s? (choice=Morphine 0.1mg/kg  (Answer10.c.))';
	var ket = '10. Was the patient given any of the following medication/s? (choice=Ketamine 0.15mg/kg  (Answer 10.a.))';
	var ther = '3.  Gender:'

	for(pt in data) {
		var count = 0;
		if (data[pt][dil] === 'Checked') {
			if(data[pt][ther].match(/^male/i)) {
				groups.dilaudidMen[pt] = data[pt];
				count+= 1;
			} else if (data[pt][ther].match(/^female/i)) {
				groups.dilaudidWo[pt] = data[pt];
				count+= 1;
			}
		}
		if(data[pt][ket] === 'Checked'){
			if(data[pt][ther].match(/^male/i)) {
				groups.ketamineMen[pt] = data[pt];
				count+= 1;
			} else if (data[pt][ther].match(/^female/i)) {
				groups.ketamineWo[pt] = data[pt];
				count+= 1;
			}
		}
		if(data[pt][morp] === 'Checked') {
			if(data[pt][ther].match(/^male/i)) {
				groups.morphineMen[pt] = data[pt];
				count+= 1;
			} else if (data[pt][ther].match(/^female/i)) {
				groups.morphineWo[pt] = data[pt];
				count+= 1;
			}
		}
		if(count > 1) {
			console.error(pt + ' is in multiple groups')
		}
	}
	return groups;
}

var groupsRace = function (data) {
	var groups = {ketamineW: {}, dilaudidW: {}, morphineW: {}, ketamineNW: {}, dilaudidNW: {}, morphineNW: {}};
	var dil = '10. Was the patient given any of the following medication/s? (choice=Hydromorphine (Dilaudid) 1mg or 0.015mg/kg (Answer 10.b.))';
	var morp = '10. Was the patient given any of the following medication/s? (choice=Morphine 0.1mg/kg  (Answer10.c.))';
	var ket = '10. Was the patient given any of the following medication/s? (choice=Ketamine 0.15mg/kg  (Answer 10.a.))';
	var ther = '4.  Race:'

	for(pt in data) {
		var count = 0;
		if (data[pt][dil] === 'Checked') {
			if(data[pt][ther].match(/white/i)) {
				groups.dilaudidW[pt] = data[pt];
				count+= 1;
			} else {
				groups.dilaudidNW[pt] = data[pt];
				count+= 1;
			}
		}
		if(data[pt][ket] === 'Checked'){
			if(data[pt][ther].match(/white/i)) {
				groups.ketamineW[pt] = data[pt];
				count+= 1;
			} else {
				groups.ketamineNW[pt] = data[pt];
				count+= 1;
			}
		}
		if(data[pt][morp] === 'Checked') {
			if(data[pt][ther].match(/white/i)) {
				groups.morphineW[pt] = data[pt];
				count+= 1;
			} else {
				groups.morphineNW[pt] = data[pt];
				count+= 1;
			}
		}
		if(count > 1) {
			console.error(pt + ' is in multiple groups')
		}
	}
	return groups;
}


// JSON.stringify(avgs.ketamine.avg).replace(/,/g, "\n").replace(/:/g, "\t").replace(/ Minutes|\"|\{|\}/g, "")
// JSON.stringify(avgs.dilaudid.avg).replace(/,/g, "\n").replace(/:/g, "\t").replace(/ Minutes|\"|\{|\}/g, "")
// JSON.stringify(avgs.morphine.avg).replace(/,/g, "\n").replace(/:/g, "\t").replace(/ Minutes|\"|\{|\}/g, "")
//20 Minutes: "7"30 Minutes: "No"40 Minutes: "6"50 Minutes: "6"60 Minutes: "6"75 Minutes: "(5) Moderate Pain"90 Minutes: "(5) Moderate Pain"105 Minutes: "(5) Moderate Pain"120 Minutes: "4"